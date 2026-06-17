import { useEffect, useMemo, useState } from 'react'
import {
  Plus, LayoutGrid, Table, CalendarDays, BarChart3, Search, Filter,
  Trash2, ChevronDown, KanbanSquare,
} from 'lucide-react'
import { usePlannerBoards, useBoardData } from '../hooks/usePlanner'
import { GROUP_BY, PRIORITIES, PRIORITY_META, PROGRESSES, PROGRESS_META, dueStatus } from '../utils/planner'
import PlannerBoardView from '../components/planner/PlannerBoardView'
import PlannerGridView from '../components/planner/PlannerGridView'
import PlannerScheduleView from '../components/planner/PlannerScheduleView'
import PlannerChartsView from '../components/planner/PlannerChartsView'
import PlannerCardDrawer from '../components/planner/PlannerCardDrawer'

const VIEWS = [
  { id: 'board',    label: 'TABLEAU',  Icon: LayoutGrid },
  { id: 'kanban',   label: 'KANBAN',   Icon: KanbanSquare },
  { id: 'grid',     label: 'GRILLE',   Icon: Table },
  { id: 'schedule', label: 'PLANNING', Icon: CalendarDays },
  { id: 'charts',   label: 'GRAPHIQUES', Icon: BarChart3 },
]

const FILTER_DEFAULT = { priority: 'all', progress: 'all', label: 'all', due: 'all' }

export default function Planner() {
  const boardsApi = usePlannerBoards()
  const { boards, loading: boardsLoading } = boardsApi

  const [boardId, setBoardId] = useState(null)
  const api = useBoardData(boardId)
  const { board, buckets, tasks } = api

  const [view, setView]       = useState('board')
  const [groupBy, setGroupBy] = useState('bucket')
  const [search, setSearch]   = useState('')
  const [filters, setFilters] = useState(FILTER_DEFAULT)
  const [showFilters, setShowFilters] = useState(false)
  const [drawerTask, setDrawerTask]   = useState(null)
  const [boardMenu, setBoardMenu]     = useState(false)

  // Sélectionne le premier board au chargement
  useEffect(() => {
    if (!boardId && boards.length) setBoardId(boards[0].id)
  }, [boards, boardId])

  const labels = board?.labels || []

  const filtered = useMemo(() => {
    let arr = tasks
    if (search.trim()) {
      const q = search.toLowerCase()
      arr = arr.filter(t => (t.title || '').toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q))
    }
    if (filters.priority !== 'all') arr = arr.filter(t => t.priority === filters.priority)
    if (filters.progress !== 'all') arr = arr.filter(t => t.progress === filters.progress)
    if (filters.label !== 'all') arr = arr.filter(t => (t.labels || []).includes(filters.label))
    if (filters.due !== 'all') arr = arr.filter(t => dueStatus(t.dueDate, t.progress) === filters.due)
    return arr
  }, [tasks, search, filters])

  const activeFilters = Object.values(filters).filter(v => v !== 'all').length + (search.trim() ? 1 : 0)

  async function handleNewBoard() {
    const b = await boardsApi.create({ name: 'NOUVEAU PLAN' })
    setBoardId(b.id)
  }
  function handleRenameBoard() {
    const name = prompt('Nom du plan :', board?.name)
    if (name && name.trim()) { boardsApi.update(boardId, { name: name.trim() }); api.setBoard(b => ({ ...b, name: name.trim() })) }
    setBoardMenu(false)
  }
  function handleDeleteBoard() {
    if (!confirm(`Supprimer le plan « ${board?.name} » et toutes ses tâches ?`)) return
    boardsApi.remove(boardId)
    const next = boards.find(b => b.id !== boardId)
    setBoardId(next?.id || null)
    setBoardMenu(false)
  }

  function saveTask(draft) {
    const { id, boardId: _b, createdAt, updatedAt, ...patch } = draft
    api.updateTask(id, patch)
    setDrawerTask(null)
  }
  function deleteTask(id) { api.removeTask(id); setDrawerTask(null) }

  // — États vides —
  if (boardsLoading) {
    return <div className="empty-state">// CHARGEMENT…</div>
  }
  if (!boards.length) {
    return (
      <div className="under-construction">
        <KanbanSquare size={48} className="t-accent" />
        <div className="uc-title">PLANNER</div>
        <div className="uc-sub">// AUCUN PLAN — CRÉEZ VOTRE PREMIER TABLEAU</div>
        <button className="btn btn-primary" onClick={handleNewBoard}>
          <Plus size={14} /> &nbsp;NOUVEAU PLAN
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* En-tête : sélecteur de plan + actions */}
      <div className="row between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div className="row gap-sm">
          <h2 className="t-display" style={{ fontSize: 24 }}>// PLANNER</h2>
          <div className="pl-board-select">
            <select className="select" value={boardId || ''} onChange={e => setBoardId(e.target.value)}>
              {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <div style={{ position: 'relative' }}>
              <button className="btn btn-ghost btn-icon" onClick={() => setBoardMenu(m => !m)}>
                <ChevronDown size={15} />
              </button>
              {boardMenu && (
                <div className="pl-menu" style={{ right: 0 }} onMouseLeave={() => setBoardMenu(false)}>
                  <button onClick={handleRenameBoard}>Renommer le plan</button>
                  <button onClick={handleNewBoard}>Nouveau plan</button>
                  <button className="danger" onClick={handleDeleteBoard}><Trash2 size={13} /> Supprimer le plan</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
          <div className="pl-search">
            <Search size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="// rechercher" />
          </div>
          <button className={`btn btn-ghost ${activeFilters ? 'pl-filter-active' : ''}`} onClick={() => setShowFilters(f => !f)}>
            <Filter size={14} /> &nbsp;FILTRES{activeFilters ? ` · ${activeFilters}` : ''}
          </button>
        </div>
      </div>

      {/* Barre de vues + regroupement */}
      <div className="todo-toolbar">
        <div className="tabs">
          {VIEWS.map(v => (
            <button key={v.id} className={`tab ${view === v.id ? 'active' : ''}`} onClick={() => setView(v.id)}>
              <v.Icon size={12} style={{ verticalAlign: 'middle' }} /> {v.label}
            </button>
          ))}
        </div>
        {view === 'board' && (
          <div className="row gap-sm" style={{ marginLeft: 'auto' }}>
            <span className="t-label">GROUPER PAR</span>
            <select className="select" style={{ width: 'auto' }} value={groupBy} onChange={e => setGroupBy(e.target.value)}>
              {GROUP_BY.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="todo-toolbar" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '12px 14px' }}>
          <span className="t-label">PRIORITÉ</span>
          <select className="select" style={{ width: 'auto' }} value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="all">TOUTES</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
          </select>
          <span className="t-label">PROGRESSION</span>
          <select className="select" style={{ width: 'auto' }} value={filters.progress} onChange={e => setFilters(f => ({ ...f, progress: e.target.value }))}>
            <option value="all">TOUTES</option>
            {PROGRESSES.map(p => <option key={p} value={p}>{PROGRESS_META[p].label}</option>)}
          </select>
          <span className="t-label">ÉTIQUETTE</span>
          <select className="select" style={{ width: 'auto' }} value={filters.label} onChange={e => setFilters(f => ({ ...f, label: e.target.value }))}>
            <option value="all">TOUTES</option>
            {labels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <span className="t-label">ÉCHÉANCE</span>
          <select className="select" style={{ width: 'auto' }} value={filters.due} onChange={e => setFilters(f => ({ ...f, due: e.target.value }))}>
            <option value="all">TOUTES</option>
            <option value="late">EN RETARD</option>
            <option value="near">PROCHE (48H)</option>
            <option value="ok">À VENIR</option>
          </select>
          <button className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => { setFilters(FILTER_DEFAULT); setSearch('') }}>
            RÉINITIALISER
          </button>
        </div>
      )}

      {/* Vues */}
      {view === 'board' && (
        <PlannerBoardView
          groupBy={groupBy}
          buckets={buckets}
          tasks={filtered}
          labels={labels}
          api={api}
          onOpenTask={setDrawerTask}
        />
      )}
      {view === 'kanban' && (
        <PlannerBoardView
          groupBy="progress"
          buckets={buckets}
          tasks={filtered}
          labels={labels}
          api={api}
          onOpenTask={setDrawerTask}
        />
      )}
      {view === 'grid'     && <PlannerGridView buckets={buckets} tasks={filtered} labels={labels} onOpenTask={setDrawerTask} />}
      {view === 'schedule' && <PlannerScheduleView tasks={filtered} onOpenTask={setDrawerTask} />}
      {view === 'charts'   && <PlannerChartsView buckets={buckets} tasks={filtered} />}

      {/* Tiroir d'édition */}
      {drawerTask && (
        <PlannerCardDrawer
          task={drawerTask}
          buckets={buckets}
          labels={labels}
          onClose={() => setDrawerTask(null)}
          onSave={saveTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  )
}
