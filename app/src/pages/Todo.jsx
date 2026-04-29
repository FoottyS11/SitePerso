import { useMemo, useState } from 'react'
import { Plus, Filter, ListChecks, CalendarDays, Tags } from 'lucide-react'
import TaskItem from '../components/TaskItem'
import TaskDrawer from '../components/TaskDrawer'
import CategoryDrawer from '../components/CategoryDrawer'
import Calendar from '../components/Calendar'
import { useTodos } from '../hooks/useTodos'
import { useCategories } from '../hooks/useCategories'
import { useReminders } from '../hooks/useReminders'
import { PRIORITIES, effectiveDeadline } from '../utils/deadlines'

const SORT_OPTIONS = [
  { id: 'created',  label: 'CRÉATION' },
  { id: 'deadline', label: 'DEADLINE' },
  { id: 'priority', label: 'PRIORITÉ' }
]

export default function Todo() {
  const { todos, create, update, remove, toggleStatus } = useTodos()
  const { categories, create: createCat, update: updateCat, remove: removeCat } = useCategories()
  useReminders(todos)

  const [view, setView] = useState('list') // 'list' | 'calendar'
  const [drawerTask, setDrawerTask] = useState(null)
  const [catDrawerOpen, setCatDrawerOpen] = useState(false)
  const [filters, setFilters] = useState({ status: 'all', priority: 'all', category: 'all' })
  const [sort, setSort] = useState('priority')

  const counts = useMemo(() => ({
    total: todos.length,
    todo: todos.filter(t => t.status === 'todo').length,
    done: todos.filter(t => t.status === 'done').length,
    cancelled: todos.filter(t => t.status === 'cancelled').length
  }), [todos])

  const filtered = useMemo(() => {
    let arr = [...todos]
    if (filters.status !== 'all') arr = arr.filter(t => t.status === filters.status)
    if (filters.priority !== 'all') arr = arr.filter(t => t.priority === filters.priority)
    if (filters.category !== 'all') arr = arr.filter(t => (t.categoryId || 'none') === filters.category)

    if (sort === 'priority') {
      arr.sort((a, b) => {
        const pa = PRIORITIES.indexOf(a.priority)
        const pb = PRIORITIES.indexOf(b.priority)
        if (pa !== pb) return pa - pb
        return effectiveDeadline(a).date - effectiveDeadline(b).date
      })
    } else if (sort === 'deadline') {
      arr.sort((a, b) => effectiveDeadline(a).date - effectiveDeadline(b).date)
    } else {
      arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
    return arr
  }, [todos, filters, sort])

  // Groupage par catégorie
  const grouped = useMemo(() => {
    const map = new Map()
    filtered.forEach(t => {
      const key = t.categoryId || 'uncategorized'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(t)
    })
    return Array.from(map.entries())
  }, [filtered])

  function openNew() {
    const now = new Date().toISOString()
    setDrawerTask({
      id: null,
      text: '',
      status: 'todo',
      priority: 'P3',
      categoryId: null,
      color: null,
      emoji: null,
      comment: '',
      markdown: '',
      dueDate: null,
      reminder: null,
      createdAt: now,
      updatedAt: now
    })
  }

  function handleSave(draft) {
    if (draft.id) {
      update(draft.id, draft)
    } else {
      const { id, ...rest } = draft
      create(rest)
    }
    setDrawerTask(null)
  }

  function handleDelete(id) {
    if (id) remove(id)
    setDrawerTask(null)
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="row between" style={{ marginBottom: 18 }}>
        <h2 className="t-display" style={{ fontSize: 24 }}>// TASK MANAGER</h2>
        <div className="row gap-sm">
          <div className="tabs">
            <button className={`tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
              <ListChecks size={12} style={{ verticalAlign: 'middle' }} /> LIST
            </button>
            <button className={`tab ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>
              <CalendarDays size={12} style={{ verticalAlign: 'middle' }} /> CALENDAR
            </button>
          </div>
          <button className="btn btn-ghost" onClick={() => setCatDrawerOpen(true)}>
            <Tags size={14} style={{ verticalAlign: 'middle' }} /> &nbsp;CATEGORIES
          </button>
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={14} style={{ verticalAlign: 'middle' }} /> &nbsp;NEW TASK
          </button>
        </div>
      </div>

      {/* Compteurs */}
      <div className="counter-bar">
        <span>TASKS: <strong>{counts.total}</strong></span>
        <span>· <strong>{counts.todo}</strong> TODO</span>
        <span>· <strong>{counts.done}</strong> DONE</span>
        <span>· <strong>{counts.cancelled}</strong> CANCELLED</span>
      </div>

      {/* Filtres */}
      {view === 'list' && (
        <div className="todo-toolbar">
          <span className="t-label"><Filter size={11} style={{ verticalAlign: 'middle' }} /> FILTERS</span>
          <select className="select" style={{ width: 'auto' }} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="all">STATUS · ALL</option>
            <option value="todo">TODO</option>
            <option value="done">DONE</option>
            <option value="cancelled">CANCELLED</option>
          </select>
          <select className="select" style={{ width: 'auto' }} value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="all">PRIORITY · ALL</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="select" style={{ width: 'auto' }} value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
            <option value="all">CATEGORY · ALL</option>
            <option value="none">// none</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <span className="t-label" style={{ marginLeft: 'auto' }}>SORT</span>
          <select className="select" style={{ width: 'auto' }} value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
      )}

      {/* Vue liste */}
      {view === 'list' && (
        grouped.length === 0 ? (
          <div className="empty-state">// NO TASKS · CREATE ONE TO START</div>
        ) : (
          grouped.map(([catId, list]) => {
            const cat = catId === 'uncategorized' ? null : categories.find(c => c.id === catId)
            return (
              <div key={catId} style={{ marginBottom: 22 }}>
                <div className="section-title" style={{ color: cat?.color || 'var(--text-secondary)' }}>
                  // {cat ? cat.name : 'UNCATEGORIZED'} · {list.length}
                </div>
                <div className="task-list">
                  {list.map(t => (
                    <TaskItem
                      key={t.id}
                      task={t}
                      category={cat}
                      onToggle={toggleStatus}
                      onClick={() => setDrawerTask(t)}
                    />
                  ))}
                </div>
              </div>
            )
          })
        )
      )}

      {/* Vue calendrier */}
      {view === 'calendar' && (
        <Calendar todos={todos} onTaskClick={(t) => setDrawerTask(t)} />
      )}

      {/* Task Drawer */}
      <TaskDrawer
        open={!!drawerTask && !catDrawerOpen}
        task={drawerTask}
        categories={categories}
        onClose={() => setDrawerTask(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {/* Category Drawer */}
      <CategoryDrawer
        open={catDrawerOpen}
        categories={categories}
        onCreate={createCat}
        onUpdate={updateCat}
        onDelete={removeCat}
        onClose={() => setCatDrawerOpen(false)}
      />
    </div>
  )
}
