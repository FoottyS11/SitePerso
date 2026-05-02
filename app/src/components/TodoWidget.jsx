import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PriorityBadge from './PriorityBadge'
import { PRIORITIES, effectiveDeadline, formatDateFR } from '../utils/deadlines'

export default function TodoWidget({ todos }) {
  const { remaining, top3 } = useMemo(() => {
    const todo = todos.filter(t => t.status === 'todo')
    const sorted = [...todo].sort((a, b) => {
      const pa = PRIORITIES.indexOf(a.priority)
      const pb = PRIORITIES.indexOf(b.priority)
      if (pa !== pb) return pa - pb
      return effectiveDeadline(a).date - effectiveDeadline(b).date
    })
    return { remaining: todo.length, top3: sorted.slice(0, 3) }
  }, [todos])

  return (
    <section className="card">
      <div className="card-header">
        <span className="card-title">// PENDING TASKS</span>
        <span className="t-label counter-up">REMAINING: <strong className="t-mono" style={{ color: 'var(--accent-red)' }}>{String(remaining).padStart(2, '0')}</strong></span>
      </div>

      {top3.length === 0 ? (
        <div className="empty-state">// QUEUE EMPTY · GO RACE</div>
      ) : (
        <div className="task-list">
          {top3.map(t => {
            const hasDeadline = t.dueDate || t.priority
            const { date, isAuto } = hasDeadline ? effectiveDeadline(t) : { date: null, isAuto: false }
            return (
              <div key={t.id} className={`task-item bl-${t.priority}`} style={{ cursor: 'default' }}>
                <PriorityBadge priority={t.priority} compact />
                <div className="task-text">{t.text || <span className="t-muted">// untitled</span>}</div>
                <div className="task-meta">
                  {date && <span className={`deadline-tag ${isAuto ? 'deadline-auto' : ''}`}>{formatDateFR(date)}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 14, textAlign: 'right' }}>
        <Link to="/todo" className="t-label" style={{ color: 'var(--accent-red)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          → VOIR TOUT <ArrowRight size={12} />
        </Link>
      </div>
    </section>
  )
}
