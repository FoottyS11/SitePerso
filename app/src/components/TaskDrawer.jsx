import { useCallback, useEffect, useMemo, useState } from 'react'
import { X, Trash2, Save, Eye, Edit3 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { PRIORITIES, PRIORITY_META, effectiveDeadline, formatDateFR, relativeFromNow } from '../utils/deadlines'
import EmojiPicker from './EmojiPicker'

const TASK_COLORS = [
  null,
  '#e8003d', '#ff4400', '#ff9800', '#ffeb3b',
  '#00e676', '#00bcd4', '#2196f3', '#9c27b0',
  '#ffffff', '#6b6870'
]

const STATUSES = [
  { id: 'todo',      label: '☐ TODO' },
  { id: 'done',      label: '✓ DONE' },
  { id: 'cancelled', label: '✗ CANCELLED' }
]

function toLocalInputValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function toLocalDateValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function TaskDrawer({ open, task, categories, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(task || null)
  const [mdMode, setMdMode] = useState('edit')
  const [priorityFromCat, setPriorityFromCat] = useState(false)

  useEffect(() => {
    setDraft(task || null)
    setMdMode('edit')
    setPriorityFromCat(false)
  }, [task])

  const handleCategoryChange = useCallback((catId) => {
    const cat = categories.find(c => c.id === catId)
    setDraft(d => ({
      ...d,
      categoryId: catId || null,
      ...(cat?.priority ? { priority: cat.priority } : {})
    }))
    setPriorityFromCat(!!cat?.priority)
  }, [categories])

  const autoPreview = useMemo(() => {
    if (!draft) return null
    if (draft.dueDate) return null
    const { date } = effectiveDeadline(draft)
    return `→ Deadline auto : ${formatDateFR(date)} (${relativeFromNow(date)})`
  }, [draft])

  if (!open || !draft) return null

  function patch(p) { setDraft(d => ({ ...d, ...p })) }

  function handleSave() {
    onSave?.(draft)
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-header">
          <span className="card-title">// {draft.id ? 'EDIT TASK' : 'NEW TASK'}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Texte */}
          <div className="field">
            <label className="t-label">TASK</label>
            <input
              className="input"
              autoFocus
              value={draft.text}
              onChange={e => patch({ text: e.target.value })}
              placeholder="// describe the task"
            />
          </div>

          {/* Priorité */}
          <div className="field">
            <label className="t-label">PRIORITY</label>
            <div className="priority-picker">
              {PRIORITIES.map(p => {
                const meta = PRIORITY_META[p]
                const active = draft.priority === p
                return (
                  <button
                    key={p}
                    className={`priority-btn ${active ? 'active' : ''}`}
                    style={{ color: meta.color }}
                    onClick={() => { patch({ priority: p }); setPriorityFromCat(false) }}
                    type="button"
                  >
                    {p} · {meta.label}
                  </button>
                )
              })}
            </div>
            {priorityFromCat && (
              <span className="t-label" style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
                ← HÉRITÉE DE LA CATÉGORIE · cliquer pour overrider
              </span>
            )}
            {autoPreview && (
              <span className="t-label" style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
                {autoPreview}
              </span>
            )}
          </div>

          {/* Catégorie */}
          <div className="field">
            <label className="t-label">CATEGORY</label>
            <select
              className="select"
              value={draft.categoryId || ''}
              onChange={e => handleCategoryChange(e.target.value)}
            >
              <option value="">// none</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.emoji ? `${c.emoji} ` : ''}{c.name}{c.priority ? ` · ${c.priority}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Emoji */}
          <div className="field">
            <label className="t-label">EMOJI <span className="t-muted">(facultatif)</span></label>
            <EmojiPicker
              value={draft.emoji || ''}
              onChange={v => patch({ emoji: v || null })}
            />
          </div>

          {/* Couleur de la task */}
          <div className="field">
            <label className="t-label">TASK COLOR</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {TASK_COLORS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => patch({ color: c })}
                  title={c || 'default'}
                  style={{
                    width: 28, height: 28, flexShrink: 0,
                    background: c || 'var(--bg-base)',
                    border: draft.color === c
                      ? '2px solid var(--text-primary)'
                      : '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  {c === null && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1 }}>✕</span>
                  )}
                </button>
              ))}
              <input
                type="color"
                value={draft.color || '#e8003d'}
                onChange={e => patch({ color: e.target.value })}
                title="Couleur personnalisée"
                style={{
                  width: 28, height: 28, padding: 2,
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer', flexShrink: 0
                }}
              />
            </div>
          </div>

          {/* Statut */}
          <div className="field">
            <label className="t-label">STATUS</label>
            <div className="status-toggle" role="radiogroup">
              {STATUSES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  className={draft.status === s.id ? 'active' : ''}
                  onClick={() => patch({ status: s.id })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="field-row">
            <div className="field flex-1">
              <label className="t-label">DUE DATE (override auto)</label>
              <input
                type="date"
                className="input"
                value={toLocalDateValue(draft.dueDate)}
                onChange={e => patch({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </div>
            <div className="field flex-1">
              <label className="t-label">REMINDER</label>
              <input
                type="datetime-local"
                className="input"
                value={toLocalInputValue(draft.reminder)}
                onChange={e => patch({ reminder: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </div>
          </div>

          {/* Comment */}
          <div className="field">
            <label className="t-label">COMMENT</label>
            <textarea
              className="textarea"
              rows={2}
              value={draft.comment}
              onChange={e => patch({ comment: e.target.value })}
              placeholder="// short note"
            />
          </div>

          {/* Markdown */}
          <div className="field">
            <div className="row between">
              <label className="t-label">MARKDOWN NOTES</label>
              <div className="md-toolbar">
                <button type="button" className={`md-tab ${mdMode === 'edit' ? 'active' : ''}`} onClick={() => setMdMode('edit')}>
                  <Edit3 size={11} style={{ verticalAlign: 'middle' }} /> EDIT
                </button>
                <button type="button" className={`md-tab ${mdMode === 'preview' ? 'active' : ''}`} onClick={() => setMdMode('preview')}>
                  <Eye size={11} style={{ verticalAlign: 'middle' }} /> PREVIEW
                </button>
              </div>
            </div>
            {mdMode === 'edit' ? (
              <textarea
                className="textarea"
                rows={6}
                value={draft.markdown}
                onChange={e => patch({ markdown: e.target.value })}
                placeholder="# Heading&#10;- list&#10;- **bold**"
              />
            ) : (
              <div className="md-preview">
                {draft.markdown
                  ? <ReactMarkdown>{draft.markdown}</ReactMarkdown>
                  : <span className="t-muted">// nothing to preview</span>}
              </div>
            )}
          </div>
        </div>

        <div className="drawer-footer">
          <button className="btn btn-ghost" onClick={() => onDelete?.(draft.id)}>
            <Trash2 size={14} /> &nbsp;DELETE
          </button>
          <div className="row gap-sm">
            <button className="btn btn-ghost" onClick={onClose}>CANCEL</button>
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={14} /> &nbsp;SAVE
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
