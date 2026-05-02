import { useState, useRef, useEffect, useCallback } from 'react'

const CATS = {
  '⭐': ['✅', '🔥', '🚀', '⭐', '💡', '🎯', '⚡', '🏆', '💪', '🎉', '⚠️', '❌', '📌', '🔑', '🧩'],
  '📋': ['📋', '✏️', '📝', '🖊️', '📎', '🔗', '📂', '🗂️', '📊', '📈', '📉', '🗓️', '⏰', '⌛', '🔔'],
  '💻': ['💻', '🖥️', '⌨️', '🖱️', '📱', '🔧', '⚙️', '🛠️', '🐛', '🔌', '💾', '📡', '🌐', '🔒', '🔓'],
  '🏠': ['🏠', '🏡', '🏗️', '🚪', '🪟', '💡', '🔦', '🛋️', '🪴', '🧹', '🛏️', '🧰', '🪛', '🔩', '🧱'],
  '😀': ['😀', '😎', '🤔', '😅', '😤', '😴', '🥳', '😱', '🤓', '😇', '🥺', '🫡', '🤝', '👋', '👍'],
  '❤️': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💗', '💖', '💝', '💞', '💓', '🔴', '🟢'],
  '🐾': ['🐶', '🐱', '🦊', '🐻', '🐼', '🐯', '🦁', '🐙', '🦋', '🐝', '🦅', '🐬', '🦄', '🐲', '🦖'],
  '🍕': ['🍕', '🍔', '🌮', '🍣', '🍜', '🍩', '☕', '🍺', '🥤', '🍎', '🥑', '🫐', '🍰', '🧃', '🍫'],
  '✈️': ['✈️', '🚗', '🚂', '🚢', '🏖️', '🏔️', '🗺️', '🧳', '🏛️', '⛺', '🌍', '🌴', '🌆', '🗼', '🏝️'],
  '💰': ['💰', '💵', '💳', '📊', '📈', '🏦', '💹', '🪙', '💎', '🤑', '💸', '🧾', '🏧', '📑', '🔐'],
  '🎮': ['🎮', '🕹️', '🎲', '♟️', '🎯', '⚽', '🏀', '🎾', '🎹', '🎸', '🎺', '🥁', '🎭', '🎨', '🎬'],
  '🔢': ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '#️⃣', '*️⃣', '🔠', '🔡'],
}

const CAT_KEYS = Object.keys(CATS)

export default function EmojiPicker({ value, onChange }) {
  const [open, setOpen]       = useState(false)
  const [tab, setTab]         = useState(CAT_KEYS[0])
  const [dropAlign, setDropAlign] = useState('left')
  const ref                   = useRef(null)

  useEffect(() => {
    if (!open) return
    function outside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [open])

  const handleToggle = useCallback(() => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setDropAlign(rect.left + 272 > window.innerWidth - 8 ? 'right' : 'left')
    }
    setOpen(o => !o)
  }, [open])

  function pick(emoji) {
    onChange(emoji)
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }} ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        title="Choisir un emoji"
        style={{
          fontSize: 20,
          minWidth: 44, height: 36,
          padding: '0 8px',
          background: open ? 'var(--bg-surface)' : 'var(--bg-base)',
          border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          transition: 'border-color 0.15s',
          flexShrink: 0,
        }}
      >
        <span>{value || '🏷️'}</span>
        <span style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 1 }}>{open ? '▲' : '▼'}</span>
      </button>

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          title="Supprimer l'emoji"
          style={{
            fontSize: 11, color: 'var(--text-muted)',
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '2px 4px', lineHeight: 1,
          }}
        >
          ✕
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          zIndex: 2000,
          top: 'calc(100% + 4px)',
          ...(dropAlign === 'right' ? { right: 0 } : { left: 0 }),
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-bright)',
          width: 272,
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        }}>
          {/* Category tabs */}
          <div style={{
            display: 'flex', overflowX: 'auto', gap: 2,
            padding: '6px 8px',
            borderBottom: '1px solid var(--border)',
            scrollbarWidth: 'none',
          }}>
            {CAT_KEYS.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setTab(cat)}
                title={cat}
                style={{
                  fontSize: 16,
                  width: 32, height: 28,
                  background: tab === cat ? 'var(--accent)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: tab === cat ? 1 : 0.6,
                  transition: 'opacity 0.1s, background 0.1s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 2,
            padding: 8,
            maxHeight: 196, overflowY: 'auto',
          }}>
            {CATS[tab].map((emoji, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pick(emoji)}
                title={emoji}
                style={{
                  fontSize: 20,
                  width: 36, height: 36,
                  background: value === emoji ? 'var(--accent)' : 'transparent',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (value !== emoji) e.currentTarget.style.background = 'var(--bg-surface)' }}
                onMouseLeave={e => { if (value !== emoji) e.currentTarget.style.background = 'transparent' }}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Current selection display */}
          <div style={{
            padding: '6px 10px',
            borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span className="t-label" style={{ color: 'var(--text-muted)' }}>
              {value ? `SÉLECTIONNÉ : ${value}` : '// aucun emoji sélectionné'}
            </span>
            {value && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { onChange(''); setOpen(false) }}
                style={{ fontSize: 10, padding: '2px 8px', height: 24 }}
              >
                ✕ EFFACER
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
