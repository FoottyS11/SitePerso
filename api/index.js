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

// ── HEALTH ────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true }))

app.listen(3001, () => console.log('[API] Running on :3001  DB:', DB_PATH))
