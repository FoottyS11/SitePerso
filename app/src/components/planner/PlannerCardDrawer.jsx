import { useEffect, useState } from 'react'
import {
  X, Trash2, Save, Plus, Check, Square, CheckSquare, UserPlus,
} from 'lucide-react'
import { uid } from '../../utils/storage'
import {
  PRIORITIES, PRIORITY_META, PROGRESSES, PROGRESS_META, checklistProgress,
  initials, avatarColor,
} from '../../utils/planner'

function toDateValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export default function PlannerCardDrawer({ task, buckets, labels, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(task)
  const [chkInput, setChkInput] = useState('')
  const [assignInput, setAssignInput] = useState('')

  useEffect(() => { setDraft(task); setChkInput(''); setAssignInput('') }, [task])

  if (!draft) return null
  const patch = p => setDraft(d => ({ ...d, ...p }))
  const chk = checklistProgress(draft.checklist)

  function toggleLabel(id) {
    const has = (draft.labels || []).includes(id)
    patch({ labels: has ? draft.labels.filter(l => l !== id) : [...(draft.labels || []), id] })
  }
  function addChecklist() {
    const text = chkInput.trim()
    if (!text) return
    patch({ checklist: [...(draft.checklist || []), { id: uid(), text, done: false }] })
    setChkInput('')
  }
  function toggleChk(id) {
    patch({ checklist: draft.checklist.map(c => c.id === id ? { ...c, done: !c.done } : c) })
  }
  function editChk(id, text) {
    patch({ checklist: draft.checklist.map(c => c.id === id ? { ...c, text } : c) })
  }
  function removeChk(id) {
    patch({ checklist: draft.checklist.filter(c => c.id !== id) })
  }
  function addAssignee() {
    const name = assignInput.trim()
    if (!name || (draft.assignees || []).includes(name)) { setAssignInput(''); return }
    patch({ assignees: [...(draft.assignees || []), name] })
    setAssignInput('')
  }
  function removeAssignee(name) {
    patch({ assignees: draft.assignees.filter(a => a !== name) })
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer pl-drawer" role="dialog" aria-modal="true">
        <div className="drawer-header">
          <span className="card-title">// {draft.title ? 'ÉDITER LA TÂCHE' : 'NOUVELLE TÂCHE'}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fermer"><X size={16} /></button>
        </div>

        <div className="drawer-body">
          {/* Titre */}
          <div className="field">
            <label className="t-label">TITRE</label>
            <input className="input" autoFocus value={draft.title}
              onChange={e => patch({ title: e.target.value })}
              placeholder="// nom de la tâche" />
          </div>

          {/* Compartiment + Progression */}
          <div className="field-row">
            <div className="field flex-1">
              <label className="t-label">COMPARTIMENT</label>
              <select className="select" value={draft.bucketId}
                onChange={e => patch({ bucketId: e.target.value })}>
                {buckets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="field flex-1">
              <label className="t-label">PROGRESSION</label>
              <select className="select" value={draft.progress}
                onChange={e => patch({ progress: e.target.value })}>
                {PROGRESSES.map(p => <option key={p} value={p}>{PROGRESS_META[p].label}</option>)}
              </select>
            </div>
          </div>

          {/* Priorité */}
          <div className="field">
            <label className="t-label">PRIORITÉ</label>
            <div className="priority-picker" style={{ flexWrap: 'wrap' }}>
              {PRIORITIES.map(p => {
                const m = PRIORITY_META[p]
                return (
                  <button key={p} type="button"
                    className={`priority-btn ${draft.priority === p ? 'active' : ''}`}
                    style={{ color: m.color }}
                    onClick={() => patch({ priority: p })}>
                    <m.Icon size={11} style={{ verticalAlign: 'middle' }} /> {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dates */}
          <div className="field-row">
            <div className="field flex-1">
              <label className="t-label">DÉBUT</label>
              <input type="date" className="input" value={toDateValue(draft.startDate)}
                onChange={e => patch({ startDate: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
            <div className="field flex-1">
              <label className="t-label">ÉCHÉANCE</label>
              <input type="date" className="input" value={toDateValue(draft.dueDate)}
                onChange={e => patch({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
          </div>

          {/* Étiquettes */}
          <div className="field">
            <label className="t-label">ÉTIQUETTES</label>
            <div className="pl-label-grid">
              {labels.map(l => {
                const active = (draft.labels || []).includes(l.id)
                return (
                  <button key={l.id} type="button"
                    className={`pl-label-pick ${active ? 'active' : ''}`}
                    style={{ background: active ? l.color : 'transparent', borderColor: l.color, color: active ? '#0a0a0f' : l.color }}
                    onClick={() => toggleLabel(l.id)}>
                    {active && <Check size={12} />} {l.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Assignés */}
          <div className="field">
            <label className="t-label">ASSIGNÉ À</label>
            <div className="pl-assignees">
              {(draft.assignees || []).map(a => (
                <span key={a} className="pl-assignee-chip">
                  <span className="pl-avatar" style={{ background: avatarColor(a) }}>{initials(a)}</span>
                  {a}
                  <button onClick={() => removeAssignee(a)}><X size={12} /></button>
                </span>
              ))}
            </div>
            <div className="row gap-sm" style={{ marginTop: 8 }}>
              <input className="input" value={assignInput}
                onChange={e => setAssignInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAssignee() } }}
                placeholder="// ajouter une personne" />
              <button className="btn btn-ghost btn-icon" onClick={addAssignee}><UserPlus size={15} /></button>
            </div>
          </div>

          {/* Liste de contrôle */}
          <div className="field">
            <label className="t-label">
              LISTE DE CONTRÔLE {chk && <span className="t-muted">· {chk.done}/{chk.total}</span>}
            </label>
            {chk && (
              <div className="pl-chk-bar"><span style={{ width: `${(chk.done / chk.total) * 100}%` }} /></div>
            )}
            <div className="pl-checklist">
              {(draft.checklist || []).map(c => (
                <div key={c.id} className="pl-chk-item">
                  <button className="pl-chk-box" onClick={() => toggleChk(c.id)}>
                    {c.done ? <CheckSquare size={15} /> : <Square size={15} />}
                  </button>
                  <input className={`pl-chk-text ${c.done ? 'done' : ''}`} value={c.text}
                    onChange={e => editChk(c.id, e.target.value)} />
                  <button className="pl-chk-del" onClick={() => removeChk(c.id)}><X size={13} /></button>
                </div>
              ))}
            </div>
            <div className="row gap-sm" style={{ marginTop: 6 }}>
              <input className="input" value={chkInput}
                onChange={e => setChkInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklist() } }}
                placeholder="// nouvel élément" />
              <button className="btn btn-ghost btn-icon" onClick={addChecklist}><Plus size={15} /></button>
            </div>
          </div>

          {/* Notes */}
          <div className="field">
            <label className="t-label">NOTES</label>
            <textarea className="textarea" rows={4} value={draft.notes || ''}
              onChange={e => patch({ notes: e.target.value })}
              placeholder="// description, détails…" />
          </div>
        </div>

        <div className="drawer-footer">
          <button className="btn btn-ghost" onClick={() => onDelete?.(draft.id)}>
            <Trash2 size={14} /> &nbsp;SUPPRIMER
          </button>
          <div className="row gap-sm">
            <button className="btn btn-ghost" onClick={onClose}>ANNULER</button>
            <button className="btn btn-primary" onClick={() => onSave(draft)}>
              <Save size={14} /> &nbsp;ENREGISTRER
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
