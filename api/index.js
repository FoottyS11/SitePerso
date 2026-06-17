import express from 'express'
import Database from 'better-sqlite3'
import { createHash } from 'crypto'
import { existsSync, readdirSync, statSync, unlinkSync, mkdirSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const DATA_DIR    = process.env.DATA_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data')
const DB_PATH     = path.join(DATA_DIR, 'db', 'data.sqlite')
const BACKUP_DIR  = path.join(DATA_DIR, 'backups')
const CONFIG_PATH = path.join(DATA_DIR, 'backup-config.json')

mkdirSync(path.join(DATA_DIR, 'db'), { recursive: true })
mkdirSync(BACKUP_DIR, { recursive: true })

// ── DB ────────────────────────────────────────────────────
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id         TEXT PRIMARY KEY,
    text       TEXT NOT NULL DEFAULT '',
    status     TEXT NOT NULL DEFAULT 'todo',
    priority   TEXT,
    categoryId TEXT,
    color      TEXT,
    emoji      TEXT,
    comment    TEXT DEFAULT '',
    markdown   TEXT DEFAULT '',
    dueDate    TEXT,
    reminder   TEXT,
    createdAt  TEXT NOT NULL,
    updatedAt  TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS categories (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    color     TEXT DEFAULT '#e8003d',
    emoji     TEXT,
    priority  TEXT,
    createdAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS bloc2_checklist (
    crit_id TEXT PRIMARY KEY,
    checked INTEGER NOT NULL DEFAULT 0
  );

  /* ── PLANNER (clone Microsoft Planner) ─────────────────── */
  CREATE TABLE IF NOT EXISTS planner_boards (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL DEFAULT 'NOUVEAU PLAN',
    emoji     TEXT,
    labels    TEXT NOT NULL DEFAULT '[]',
    position  INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS planner_buckets (
    id        TEXT PRIMARY KEY,
    boardId   TEXT NOT NULL,
    name      TEXT NOT NULL DEFAULT 'NOUVEAU COMPARTIMENT',
    position  INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS planner_tasks (
    id         TEXT PRIMARY KEY,
    boardId    TEXT NOT NULL,
    bucketId   TEXT NOT NULL,
    title      TEXT NOT NULL DEFAULT '',
    notes      TEXT DEFAULT '',
    priority   TEXT NOT NULL DEFAULT 'medium',
    progress   TEXT NOT NULL DEFAULT 'notstarted',
    labels     TEXT NOT NULL DEFAULT '[]',
    checklist  TEXT NOT NULL DEFAULT '[]',
    assignees  TEXT NOT NULL DEFAULT '[]',
    startDate  TEXT,
    dueDate    TEXT,
    position   INTEGER NOT NULL DEFAULT 0,
    createdAt  TEXT NOT NULL,
    updatedAt  TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_planner_buckets_board ON planner_buckets(boardId);
  CREATE INDEX IF NOT EXISTS idx_planner_tasks_board   ON planner_tasks(boardId);
`)

const uid = () => createHash('sha1').update(Date.now() + Math.random().toString()).digest('hex').slice(0, 12)

// ── CONFIG ────────────────────────────────────────────────
const DEFAULT_CONFIG = { enabled: true, frequency: 'daily', hour: 3, weekday: 1, retention: 2 }

async function readConfig() {
  try { return { ...DEFAULT_CONFIG, ...JSON.parse(await readFile(CONFIG_PATH, 'utf8')) } }
  catch { return { ...DEFAULT_CONFIG } }
}
async function saveConfig(c) { await writeFile(CONFIG_PATH, JSON.stringify(c, null, 2)) }

// ── BACKUPS helpers ───────────────────────────────────────
function listBackups() {
  if (!existsSync(BACKUP_DIR)) return []
  return readdirSync(BACKUP_DIR)
    .filter(f => /^backup_.*\.sqlite$/.test(f))
    .map(name => {
      const s = statSync(path.join(BACKUP_DIR, name))
      return { name, size: s.size, date: s.mtime.toISOString() }
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

function applyRetention(retention) {
  const all = listBackups()
  all.slice(retention).forEach(b => {
    try { unlinkSync(path.join(BACKUP_DIR, b.name)) } catch {}
  })
}

// ── EXPRESS ───────────────────────────────────────────────
const app = express()
app.use(express.json({ limit: '10mb' }))

// CORS pour dev
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// ── TODOS ─────────────────────────────────────────────────
app.get('/api/todos', (_, res) => {
  res.json(db.prepare('SELECT * FROM todos ORDER BY createdAt DESC').all())
})

app.post('/api/todos', (req, res) => {
  const now = new Date().toISOString()
  const t = { id: uid(), text: '', status: 'todo', priority: null, categoryId: null, color: null,
    emoji: null, comment: '', markdown: '', dueDate: null, reminder: null, createdAt: now, updatedAt: now, ...req.body }
  // use client-provided id if any
  db.prepare(`INSERT OR REPLACE INTO todos
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(t.id, t.text, t.status, t.priority, t.categoryId, t.color, t.emoji,
         t.comment, t.markdown, t.dueDate, t.reminder, t.createdAt, t.updatedAt)
  res.json(t)
})

app.put('/api/todos/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM todos WHERE id=?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  const t = { ...row, ...req.body, id: req.params.id, updatedAt: new Date().toISOString() }
  db.prepare(`UPDATE todos SET text=?,status=?,priority=?,categoryId=?,color=?,emoji=?,
    comment=?,markdown=?,dueDate=?,reminder=?,updatedAt=? WHERE id=?`)
    .run(t.text, t.status, t.priority, t.categoryId, t.color, t.emoji,
         t.comment, t.markdown, t.dueDate, t.reminder, t.updatedAt, t.id)
  res.json(t)
})

app.delete('/api/todos/:id', (req, res) => {
  db.prepare('DELETE FROM todos WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// ── CATEGORIES ────────────────────────────────────────────
app.get('/api/categories', (_, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY createdAt ASC').all())
})

app.post('/api/categories', (req, res) => {
  const c = { id: uid(), name: 'NEW', color: '#3d3d4a', emoji: null, priority: null,
    createdAt: new Date().toISOString(), ...req.body }
  db.prepare('INSERT OR REPLACE INTO categories VALUES (?,?,?,?,?,?)')
    .run(c.id, c.name, c.color, c.emoji, c.priority, c.createdAt)
  res.json(c)
})

app.put('/api/categories/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM categories WHERE id=?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  const c = { ...row, ...req.body, id: req.params.id }
  db.prepare('UPDATE categories SET name=?,color=?,emoji=?,priority=? WHERE id=?')
    .run(c.name, c.color, c.emoji, c.priority, c.id)
  res.json(c)
})

app.delete('/api/categories/:id', (req, res) => {
  db.prepare('DELETE FROM categories WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// ── BACKUPS ───────────────────────────────────────────────
app.get('/api/backups', async (_, res) => {
  res.json({ config: await readConfig(), backups: listBackups() })
})

app.post('/api/backups', async (_, res) => {
  try {
    const cfg  = await readConfig()
    const ts   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const dest = path.join(BACKUP_DIR, `backup_${ts}.sqlite`)
    await db.backup(dest)
    applyRetention(cfg.retention)
    res.json({ ok: true, backups: listBackups() })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/backups/:name', (req, res) => {
  const name = path.basename(req.params.name)
  if (!/^backup_.*\.sqlite$/.test(name)) return res.status(400).json({ error: 'Invalid' })
  const fp = path.join(BACKUP_DIR, name)
  if (existsSync(fp)) unlinkSync(fp)
  res.json({ ok: true })
})

app.put('/api/backup-config', async (req, res) => {
  const current = await readConfig()
  const updated = { ...current, ...req.body }
  await saveConfig(updated)
  res.json(updated)
})

// ── BLOC 2 CHECKLIST ──────────────────────────────────────
app.get('/api/bloc2', (_, res) => {
  const rows = db.prepare('SELECT crit_id FROM bloc2_checklist WHERE checked=1').all()
  res.json({ checked: rows.map(r => r.crit_id) })
})

app.put('/api/bloc2', (req, res) => {
  const { critId, checked } = req.body
  if (!critId) return res.status(400).json({ error: 'critId required' })
  db.prepare('INSERT OR REPLACE INTO bloc2_checklist (crit_id, checked) VALUES (?,?)')
    .run(critId, checked ? 1 : 0)
  res.json({ ok: true })
})

app.delete('/api/bloc2', (_, res) => {
  db.prepare('UPDATE bloc2_checklist SET checked=0').run()
  res.json({ ok: true })
})

// ── MIGRATION localStorage → DB ───────────────────────────
app.post('/api/migrate', (req, res) => {
  const { todos = [], categories = [] } = req.body
  const insTodo = db.prepare(`INSERT OR REPLACE INTO todos VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
  const insCat  = db.prepare(`INSERT OR REPLACE INTO categories VALUES (?,?,?,?,?,?)`)
  const run = db.transaction(() => {
    for (const t of todos) {
      insTodo.run(t.id || uid(), t.text||'', t.status||'todo', t.priority||null,
        t.categoryId||null, t.color||null, t.emoji||null, t.comment||'',
        t.markdown||'', t.dueDate||null, t.reminder||null,
        t.createdAt||new Date().toISOString(), t.updatedAt||new Date().toISOString())
    }
    for (const c of categories) {
      insCat.run(c.id || uid(), c.name||'NEW', c.color||'#3d3d4a',
        c.emoji||null, c.priority||null, c.createdAt||new Date().toISOString())
    }
  })
  run()
  res.json({ ok: true, imported: { todos: todos.length, categories: categories.length } })
})

// ── PLANNER ───────────────────────────────────────────────
// Palette d'étiquettes par défaut (façon catégories Planner, thème HUD)
const DEFAULT_LABELS = [
  { id: 'l1', name: 'Étiquette rouge',   color: '#e8003d' },
  { id: 'l2', name: 'Étiquette orange',  color: '#ff4400' },
  { id: 'l3', name: 'Étiquette ambre',   color: '#ff9800' },
  { id: 'l4', name: 'Étiquette jaune',   color: '#ffeb3b' },
  { id: 'l5', name: 'Étiquette verte',   color: '#00e676' },
  { id: 'l6', name: 'Étiquette cyan',    color: '#00bcd4' },
  { id: 'l7', name: 'Étiquette bleue',   color: '#2196f3' },
  { id: 'l8', name: 'Étiquette violette',color: '#9c27b0' },
  { id: 'l9', name: 'Étiquette rose',    color: '#ff4081' },
  { id: 'l10', name: 'Étiquette grise',  color: '#6b6870' },
]

const parseBoard  = (r) => r && ({ ...r, labels: safeJSON(r.labels, []) })
const parseTask   = (r) => r && ({
  ...r,
  labels:    safeJSON(r.labels, []),
  checklist: safeJSON(r.checklist, []),
  assignees: safeJSON(r.assignees, []),
})
function safeJSON(v, fallback) {
  try { return typeof v === 'string' ? JSON.parse(v) : (v ?? fallback) } catch { return fallback }
}

// — BOARDS —
app.get('/api/planner/boards', (_, res) => {
  const rows = db.prepare('SELECT * FROM planner_boards ORDER BY position ASC, createdAt ASC').all()
  res.json(rows.map(parseBoard))
})

app.post('/api/planner/boards', (req, res) => {
  const now = new Date().toISOString()
  const maxPos = db.prepare('SELECT COALESCE(MAX(position),-1) p FROM planner_boards').get().p
  const b = {
    id: uid(), name: 'NOUVEAU PLAN', emoji: null,
    labels: DEFAULT_LABELS, position: maxPos + 1, createdAt: now, ...req.body,
  }
  db.prepare('INSERT OR REPLACE INTO planner_boards (id,name,emoji,labels,position,createdAt) VALUES (?,?,?,?,?,?)')
    .run(b.id, b.name, b.emoji, JSON.stringify(b.labels), b.position, b.createdAt)
  // Seed 3 compartiments par défaut
  const seed = db.prepare('INSERT INTO planner_buckets (id,boardId,name,position,createdAt) VALUES (?,?,?,?,?)')
  ;['À FAIRE', 'EN COURS', 'TERMINÉ'].forEach((name, i) => seed.run(uid(), b.id, name, i, now))
  res.json(parseBoard(db.prepare('SELECT * FROM planner_boards WHERE id=?').get(b.id)))
})

app.put('/api/planner/boards/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM planner_boards WHERE id=?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  const b = { ...parseBoard(row), ...req.body, id: req.params.id }
  db.prepare('UPDATE planner_boards SET name=?,emoji=?,labels=?,position=? WHERE id=?')
    .run(b.name, b.emoji, JSON.stringify(b.labels), b.position, b.id)
  res.json(parseBoard(db.prepare('SELECT * FROM planner_boards WHERE id=?').get(b.id)))
})

app.delete('/api/planner/boards/:id', (req, res) => {
  const tx = db.transaction((id) => {
    db.prepare('DELETE FROM planner_tasks WHERE boardId=?').run(id)
    db.prepare('DELETE FROM planner_buckets WHERE boardId=?').run(id)
    db.prepare('DELETE FROM planner_boards WHERE id=?').run(id)
  })
  tx(req.params.id)
  res.json({ ok: true })
})

// Données complètes d'un board (buckets + tasks)
app.get('/api/planner/boards/:id/data', (req, res) => {
  const board = parseBoard(db.prepare('SELECT * FROM planner_boards WHERE id=?').get(req.params.id))
  if (!board) return res.status(404).json({ error: 'Not found' })
  const buckets = db.prepare('SELECT * FROM planner_buckets WHERE boardId=? ORDER BY position ASC, createdAt ASC').all(req.params.id)
  const tasks = db.prepare('SELECT * FROM planner_tasks WHERE boardId=? ORDER BY position ASC, createdAt ASC').all(req.params.id).map(parseTask)
  res.json({ board, buckets, tasks })
})

// — BUCKETS —
app.post('/api/planner/buckets', (req, res) => {
  const now = new Date().toISOString()
  const maxPos = db.prepare('SELECT COALESCE(MAX(position),-1) p FROM planner_buckets WHERE boardId=?').get(req.body.boardId)?.p ?? -1
  const b = { id: uid(), name: 'NOUVEAU COMPARTIMENT', position: maxPos + 1, createdAt: now, ...req.body }
  db.prepare('INSERT OR REPLACE INTO planner_buckets (id,boardId,name,position,createdAt) VALUES (?,?,?,?,?)')
    .run(b.id, b.boardId, b.name, b.position, b.createdAt)
  res.json(b)
})

app.put('/api/planner/buckets/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM planner_buckets WHERE id=?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  const b = { ...row, ...req.body, id: req.params.id }
  db.prepare('UPDATE planner_buckets SET name=?,position=? WHERE id=?').run(b.name, b.position, b.id)
  res.json(b)
})

app.delete('/api/planner/buckets/:id', (req, res) => {
  const tx = db.transaction((id) => {
    db.prepare('DELETE FROM planner_tasks WHERE bucketId=?').run(id)
    db.prepare('DELETE FROM planner_buckets WHERE id=?').run(id)
  })
  tx(req.params.id)
  res.json({ ok: true })
})

// — TASKS —
const TASK_COLS = ['boardId','bucketId','title','notes','priority','progress','labels','checklist','assignees','startDate','dueDate','position','createdAt','updatedAt']
function serializeTask(t) {
  return {
    ...t,
    labels:    JSON.stringify(t.labels ?? []),
    checklist: JSON.stringify(t.checklist ?? []),
    assignees: JSON.stringify(t.assignees ?? []),
  }
}

app.post('/api/planner/tasks', (req, res) => {
  const now = new Date().toISOString()
  const maxPos = db.prepare('SELECT COALESCE(MAX(position),-1) p FROM planner_tasks WHERE bucketId=?').get(req.body.bucketId)?.p ?? -1
  const t = {
    id: uid(), title: '', notes: '', priority: 'medium', progress: 'notstarted',
    labels: [], checklist: [], assignees: [], startDate: null, dueDate: null,
    position: maxPos + 1, createdAt: now, updatedAt: now, ...req.body,
  }
  const s = serializeTask(t)
  db.prepare(`INSERT OR REPLACE INTO planner_tasks (id,${TASK_COLS.join(',')}) VALUES (?,${TASK_COLS.map(() => '?').join(',')})`)
    .run(t.id, ...TASK_COLS.map(c => s[c]))
  res.json(parseTask(db.prepare('SELECT * FROM planner_tasks WHERE id=?').get(t.id)))
})

app.put('/api/planner/tasks/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM planner_tasks WHERE id=?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  const t = { ...parseTask(row), ...req.body, id: req.params.id, updatedAt: new Date().toISOString() }
  const s = serializeTask(t)
  db.prepare(`UPDATE planner_tasks SET ${TASK_COLS.map(c => `${c}=?`).join(',')} WHERE id=?`)
    .run(...TASK_COLS.map(c => s[c]), t.id)
  res.json(parseTask(db.prepare('SELECT * FROM planner_tasks WHERE id=?').get(t.id)))
})

app.delete('/api/planner/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM planner_tasks WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// Réordonnancement / déplacement en masse (drag & drop)
app.put('/api/planner/reorder', (req, res) => {
  const { tasks = [], buckets = [] } = req.body
  const tx = db.transaction(() => {
    const ut = db.prepare('UPDATE planner_tasks SET bucketId=?, position=?, progress=?, priority=?, updatedAt=? WHERE id=?')
    for (const t of tasks) ut.run(t.bucketId, t.position, t.progress, t.priority, new Date().toISOString(), t.id)
    const ub = db.prepare('UPDATE planner_buckets SET position=? WHERE id=?')
    for (const b of buckets) ub.run(b.position, b.id)
  })
  tx()
  res.json({ ok: true })
})

// ── HEALTH ────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true }))

app.listen(3001, () => console.log('[API] Running on :3001  DB:', DB_PATH))
