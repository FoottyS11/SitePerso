import { useState, useRef } from 'react'
import { Plus, MoreHorizontal, Trash2, X, Check, GripVertical } from 'lucide-react'
import PlannerCard from './PlannerCard'
import { PRIORITIES, PRIORITY_META, PROGRESSES, PROGRESS_META } from '../../utils/planner'

// Construit la liste des colonnes selon le regroupement choisi
function buildColumns(groupBy, buckets, tasks, labels) {
  if (groupBy === 'progress') {
    return PROGRESSES.map(v => ({
      key: v, title: PROGRESS_META[v].label, color: PROGRESS_META[v].color,
      field: 'progress', value: v, droppable: true,
    }))
  }
  if (groupBy === 'priority') {
    return PRIORITIES.map(v => ({
      key: v, title: PRIORITY_META[v].label, color: PRIORITY_META[v].color,
      field: 'priority', value: v, droppable: true,
    }))
  }
  if (groupBy === 'assignee') {
    const names = new Set()
    tasks.forEach(t => (t.assignees || []).forEach(a => names.add(a)))
    const cols = [...names].sort().map(a => ({
      key: a, title: a, color: 'var(--accent-red)', field: 'assignee', value: a, droppable: false,
    }))
    cols.push({ key: '__none', title: 'NON ASSIGNÉ', color: 'var(--text-muted)', field: 'assignee', value: null, droppable: false })
    return cols
  }
  if (groupBy === 'label') {
    const cols = labels.map(l => ({
      key: l.id, title: l.name, color: l.color, field: 'label', value: l.id, droppable: false,
    }))
    cols.push({ key: '__none', title: 'SANS ÉTIQUETTE', color: 'var(--text-muted)', field: 'label', value: null, droppable: false })
    return cols
  }
  // défaut : compartiments
  return buckets.map(b => ({
    key: b.id, title: b.name, color: 'var(--accent-red)',
    field: 'bucketId', value: b.id, droppable: true, isBucket: true, bucket: b,
  }))
}

function tasksForColumn(col, tasks) {
  let arr
  if (col.field === 'assignee') {
    arr = col.value === null
      ? tasks.filter(t => !(t.assignees || []).length)
      : tasks.filter(t => (t.assignees || []).includes(col.value))
  } else if (col.field === 'label') {
    arr = col.value === null
      ? tasks.filter(t => !(t.labels || []).length)
      : tasks.filter(t => (t.labels || []).includes(col.value))
  } else {
    arr = tasks.filter(t => t[col.field] === col.value)
  }
  return arr.sort((a, b) => a.position - b.position)
}

export default function PlannerBoardView({
  groupBy, buckets, tasks, labels, api, onOpenTask,
}) {
  const [drag, setDrag]             = useState(null)   // { id } — drag d'une tâche
  const [over, setOver]             = useState(null)   // { colKey, index }
  const [bucketDrag, setBucketDrag] = useState(null)   // { id } — drag d'un compartiment
  const [bucketOver, setBucketOver] = useState(null)   // { key, after }
  const [editingBucket, setEditingBucket] = useState(null)
  const [menuBucket, setMenuBucket]       = useState(null)
  const nameRef = useRef('')

  const columns = buildColumns(groupBy, buckets, tasks, labels)

  // ── Drag d'une tâche ──
  function onDragStart(e, task) {
    setDrag({ id: task.id })
    e.dataTransfer.effectAllowed = 'move'
    try { e.dataTransfer.setData('text/plain', task.id) } catch {}
  }
  function onDragEnd() { setDrag(null); setOver(null) }

  function onCardOver(e, col, index) {
    if (bucketDrag || !col.droppable || !drag) return
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const after = e.clientY > rect.top + rect.height / 2
    setOver({ colKey: col.key, index: index + (after ? 1 : 0) })
  }

  // ── Drag d'un compartiment ──
  function onBucketDragStart(e, col) {
    setBucketDrag({ id: col.value })
    e.dataTransfer.effectAllowed = 'move'
    try { e.dataTransfer.setData('text/plain', 'bucket:' + col.value) } catch {}
  }
  function onBucketDragEnd() { setBucketDrag(null); setBucketOver(null) }

  // ── Survol d'une colonne (gère tâche OU compartiment) ──
  function onColumnOver(e, col, count) {
    if (bucketDrag) {
      if (!col.isBucket || col.value === bucketDrag.id) return
      e.preventDefault()
      const rect = e.currentTarget.getBoundingClientRect()
      const after = e.clientX > rect.left + rect.width / 2
      setBucketOver({ key: col.key, after })
      return
    }
    if (!col.droppable || !drag) return
    e.preventDefault()
    if (!over || over.colKey !== col.key) setOver({ colKey: col.key, index: count })
  }

  function onColumnDrop(e, col) {
    // Réordonnancement des compartiments
    if (bucketDrag) {
      e.preventDefault()
      const ids = buckets.map(b => b.id).filter(id => id !== bucketDrag.id)
      let idx = ids.indexOf(col.value)
      if (idx === -1) idx = ids.length
      if (bucketOver?.key === col.key && bucketOver.after) idx += 1
      ids.splice(idx, 0, bucketDrag.id)
      api.reorderBuckets(ids)
      setBucketDrag(null); setBucketOver(null)
      return
    }
    // Déplacement d'une tâche
    if (!col.droppable || !drag) return
    e.preventDefault()
    const idx = over?.colKey === col.key ? over.index : tasksForColumn(col, tasks).length
    api.moveTask(drag.id, { field: col.field, value: col.value }, idx)
    setDrag(null); setOver(null)
  }

  function startRename(bucket) {
    setEditingBucket(bucket.id); nameRef.current = bucket.name; setMenuBucket(null)
  }
  function commitRename(bucket) {
    const name = (nameRef.current || '').trim()
    if (name && name !== bucket.name) api.updateBucket(bucket.id, { name })
    setEditingBucket(null)
  }

  return (
    <div className="pl-board">
      {columns.map(col => {
        const colTasks = tasksForColumn(col, tasks)
        const isOver = over?.colKey === col.key
        const isBucketOver = bucketDrag && bucketOver?.key === col.key
        const isBucketDragging = bucketDrag?.id === col.value
        const canDragHeader = col.isBucket && editingBucket !== col.bucket?.id
        return (
          <section
            key={col.key}
            className={`pl-col ${isOver ? 'is-over' : ''}`
              + `${isBucketDragging ? ' is-bucket-dragging' : ''}`
              + `${isBucketOver ? (bucketOver.after ? ' bucket-over-after' : ' bucket-over-before') : ''}`}
            onDragOver={(e) => onColumnOver(e, col, colTasks.length)}
            onDrop={(e) => onColumnDrop(e, col)}
          >
            <header
              className={`pl-col-head ${canDragHeader ? 'is-draggable' : ''}`}
              style={{ borderTopColor: col.color }}
              draggable={canDragHeader}
              onDragStart={canDragHeader ? (e) => onBucketDragStart(e, col) : undefined}
              onDragEnd={canDragHeader ? onBucketDragEnd : undefined}
            >
              {canDragHeader && <GripVertical size={14} className="pl-col-grip" />}
              {editingBucket === col.bucket?.id ? (
                <input
                  className="input pl-col-rename"
                  autoFocus
                  defaultValue={col.title}
                  onChange={e => { nameRef.current = e.target.value }}
                  onBlur={() => commitRename(col.bucket)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRename(col.bucket)
                    if (e.key === 'Escape') setEditingBucket(null)
                  }}
                />
              ) : (
                <>
                  <span className="pl-col-title">{col.title}</span>
                  <span className="pl-col-count">{colTasks.length}</span>
                  {col.isBucket && (
                    <div className="pl-col-actions">
                      <button className="pl-icon-btn" title="Menu"
                        onClick={() => setMenuBucket(menuBucket === col.key ? null : col.key)}>
                        <MoreHorizontal size={15} />
                      </button>
                      {menuBucket === col.key && (
                        <div className="pl-menu" onMouseLeave={() => setMenuBucket(null)}>
                          <button onClick={() => startRename(col.bucket)}>
                            <Check size={13} /> Renommer
                          </button>
                          <button className="danger" onClick={() => {
                            if (confirm(`Supprimer le compartiment « ${col.title} » et ses tâches ?`)) api.removeBucket(col.bucket.id)
                            setMenuBucket(null)
                          }}>
                            <Trash2 size={13} /> Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </header>

            {/* Ajout rapide d'une tâche (uniquement compartiments) */}
            {col.isBucket && (
              <button
                className="pl-add-task"
                onClick={() => {
                  const t = api.createTask({ bucketId: col.value, title: '' })
                  onOpenTask(t)
                }}
              >
                <Plus size={14} /> Ajouter une tâche
              </button>
            )}

            <div className="pl-col-body">
              {colTasks.map((t, i) => (
                <div
                  key={t.id}
                  onDragOver={(e) => onCardOver(e, col, i)}
                >
                  {isOver && over.index === i && <div className="pl-drop-line" />}
                  <PlannerCard
                    task={t}
                    labels={labels}
                    dragging={drag?.id === t.id}
                    onClick={onOpenTask}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                </div>
              ))}
              {isOver && over.index >= colTasks.length && <div className="pl-drop-line" />}
              {colTasks.length === 0 && !col.isBucket && (
                <div className="pl-col-empty">// vide</div>
              )}
            </div>
          </section>
        )
      })}

      {/* Ajouter un compartiment (seulement en groupage par compartiment) */}
      {groupBy === 'bucket' && (
        <div className="pl-col pl-col-add">
          <button className="pl-add-bucket" onClick={() => api.createBucket('NOUVEAU COMPARTIMENT')}>
            <Plus size={16} /> Ajouter un compartiment
          </button>
        </div>
      )}
    </div>
  )
}
