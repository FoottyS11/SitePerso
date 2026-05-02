import { MessageSquare, FileText, Bell } from 'lucide-react'
import PriorityBadge from './PriorityBadge'
import { effectiveDeadline, deadlineStatus, formatDateFR, relativeFromNow } from '../utils/deadlines'

export default function TaskItem({ task, category, onToggle, onClick }) {
  const hasDeadline = task.dueDate || task.priority
  const { date, isAuto } = hasDeadline ? effectiveDeadline(task) : { date: null, isAuto: false }
  const status = date ? deadlineStatus(date) : 'ok'
  const stateClass = task.status === 'done' ? 'is-done' : task.status === 'cancelled' ? 'is-cancelled' : ''

  const leftBorderColor = task.color || category?.color || null
  const inlineStyle = leftBorderColor && task.status === 'todo'
    ? { borderLeftColor: leftBorderColor }
    : undefined

  return (
    <div
      className={`task-item ${stateClass} bl-${task.priority}`}
      style={inlineStyle}
      onClick={onClick}
      role="button"
    >
      <button
        className="status-toggle"
        onClick={(e) => { e.stopPropagation(); onToggle?.(task.id) }}
        title={`Statut: ${task.status.toUpperCase()}`}
        style={{ padding: 0 }}
      >
        <span style={{
          width: 18, height: 18, border: '1px solid var(--border-bright)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: task.status === 'done' ? 'var(--online)' : task.status === 'cancelled' ? 'var(--accent-red)' : 'transparent',
          fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1
        }}>
          {task.status === 'done' ? '✓' : task.status === 'cancelled' ? '✗' : ''}
        </span>
      </button>

      <PriorityBadge priority={task.priority} compact />

      <div className="task-text">
        {task.emoji && <span style={{ marginRight: 5, fontSize: 14 }}>{task.emoji}</span>}
        {task.text || <span className="t-muted">// untitled task</span>}
      </div>

      <div className="task-meta">
        {task.comment && <MessageSquare size={12} className="t-dim" />}
        {task.markdown && <FileText size={12} className="t-dim" />}
        {task.reminder && <Bell size={12} className="t-dim" />}
        {category && (
          <span style={{ color: category.color }}>
            · {category.emoji ? `${category.emoji} ` : ''}{category.name}
          </span>
        )}
        {date && (
          <span className={`deadline-tag ${status === 'late' ? 'deadline-late' : status === 'near' ? 'deadline-near' : ''} ${isAuto ? 'deadline-auto' : ''}`}>
            {formatDateFR(date)} · {relativeFromNow(date)}
            {isAuto && <span className="tag-auto">AUTO</span>}
          </span>
        )}
      </div>
    </div>
  )
}
