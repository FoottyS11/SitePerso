import { useState } from 'react'
import { X, Save, Trash2, Pencil, Plus } from 'lucide-react'
import { PRIORITIES, PRIORITY_META } from '../utils/deadlines'
import EmojiPicker from './EmojiPicker'

const PRESET_COLORS = [
  '#e8003d', '#ff4400', '#ff9800', '#ffeb3b',
  '#00e676', '#00bcd4', '#2196f3', '#9c27b0',
  '#ffffff', '#6b6870', '#3d3d4a', '#1a1a24'
]

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {PRESET_COLORS.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            style={{
              width: 28, height: 28,
              background: c,
              border: value === c ? '2px solid var(--text-primary)' : '1px solid var(--border)',
              cursor: 'pointer',
              outline: 'none',
              flexShrink: 0
            }}
            title={c}
          />
        ))}
        <input
          type="color"
          value={value || '#e8003d'}
          onChange={e => onChange(e.target.value)}
          title="Couleur personnalisée"
          style={{
            width: 28, height: 28,
            padding: 2,
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            flexShrink: 0
          }}
        />
      </div>
      <span className="t-label" style={{ color: value }}>{value || '#e8003d'}</span>
    </div>
  )
}

const EMPTY_FORM = { name: '', color: '#e8003d', priority: 'P3', emoji: '' }

export default function CategoryDrawer({ open, categories, onCreate, onUpdate, onDelete, onClose }) {
  const [editId, setEditId] = useState(null)
  const [form, setForm]     = useState(EMPTY_FORM)

  if (!open) return null

  function startEdit(cat) {
    setEditId(cat.id)
    setForm({
      name:     cat.name,
      color:    cat.color || '#e8003d',
      priority: cat.priority || 'P3',
      emoji:    cat.emoji || ''
    })
  }

  function cancelEdit() {
    setEditId(null)
    setForm(EMPTY_FORM)
  }

  function handleSave() {
    if (!form.name.trim()) return
    const name  = form.name.trim().toUpperCase()
    const emoji = form.emoji.trim() || null
    if (editId) {
      onUpdate(editId, { name, color: form.color, priority: form.priority, emoji })
      cancelEdit()
    } else {
      onCreate({ name, color: form.color, priority: form.priority, emoji })
      setForm(EMPTY_FORM)
    }
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-header">
          <span className="card-title">// MANAGE CATEGORIES</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        <div className="drawer-body">
          {/* ── Formulaire création / édition ── */}
          <div className="card" style={{ padding: 16, background: 'var(--bg-elevated)' }}>
            <div className="t-label" style={{ marginBottom: 12 }}>
              {editId ? '// MODIFIER' : '// NOUVELLE CATÉGORIE'}
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                <label className="t-label">NOM</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="// nom de la catégorie"
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="t-label">EMOJI</label>
                <EmojiPicker
                  value={form.emoji}
                  onChange={v => setForm(f => ({ ...f, emoji: v }))}
                />
              </div>
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label className="t-label">PRIORITÉ PAR DÉFAUT</label>
              <div className="priority-picker">
                {PRIORITIES.map(p => {
                  const meta = PRIORITY_META[p]
                  return (
                    <button
                      key={p}
                      type="button"
                      className={`priority-btn ${form.priority === p ? 'active' : ''}`}
                      style={{ color: meta.color }}
                      onClick={() => setForm(f => ({ ...f, priority: p }))}
                    >
                      {p} · {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="field" style={{ marginBottom: 16 }}>
              <label className="t-label">COULEUR</label>
              <ColorPicker value={form.color} onChange={c => setForm(f => ({ ...f, color: c }))} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleSave}>
                {editId ? <><Save size={14} style={{ verticalAlign: 'middle' }} /> UPDATE</> : <><Plus size={14} style={{ verticalAlign: 'middle' }} /> CREATE</>}
              </button>
              {editId && (
                <button className="btn btn-ghost" onClick={cancelEdit}>CANCEL</button>
              )}
            </div>
          </div>

          {/* ── Liste ── */}
          <div className="divider" />
          {categories.length === 0 ? (
            <div className="empty-state">// NO CATEGORIES · CREATE ONE</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {categories.map(cat => (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderLeft: `3px solid ${cat.color || 'var(--border-bright)'}`
                  }}
                >
                  {cat.emoji && (
                    <span style={{ fontSize: 16, lineHeight: 1 }}>{cat.emoji}</span>
                  )}
                  <span
                    className="t-mono"
                    style={{ flex: 1, fontWeight: 600, color: cat.color || 'var(--text-primary)' }}
                  >
                    {cat.name}
                  </span>
                  <span
                    className="t-label"
                    style={{ color: PRIORITY_META[cat.priority || 'P3'].color, fontFamily: 'var(--font-mono)', fontSize: 10 }}
                  >
                    {cat.priority || 'P3'}
                  </span>
                  <span className="t-label" style={{ color: cat.color, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                    {cat.color}
                  </span>
                  <button className="btn btn-ghost btn-icon" onClick={() => startEdit(cat)} title="Modifier">
                    <Pencil size={13} />
                  </button>
                  <button className="btn btn-ghost btn-icon" onClick={() => onDelete(cat.id)} title="Supprimer">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
