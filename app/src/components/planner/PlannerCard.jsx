import { CheckSquare, MessageSquare, Calendar, ListChecks, Paperclip } from 'lucide-react'
import {
  PRIORITY_META, PROGRESS_META, checklistProgress, dueStatus, formatDue,
  initials, avatarColor,
} from '../../utils/planner'

export default function PlannerCard({ task, labels = [], onClick, onDragStart, onDragEnd, dragging }) {
  const prio = PRIORITY_META[task.priority] || PRIORITY_META.medium
  const prog = PROGRESS_META[task.progress] || PROGRESS_META.notstarted
  const ProgIcon = prog.Icon
  const chk = checklistProgress(task.checklist)
  const due = dueStatus(task.dueDate, task.progress)
  const taskLabels = (task.labels || [])
    .map(id => labels.find(l => l.id === id))
    .filter(Boolean)

  return (
    <article
      className={`pl-card ${dragging ? 'is-dragging' : ''} ${task.progress === 'completed' ? 'is-done' : ''}`}
      draggable
      onDragStart={(e) => onDragStart?.(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onClick?.(task)}
      style={{ borderLeftColor: prio.color }}
    >
      {/* Bandeau d'étiquettes colorées */}
      {taskLabels.length > 0 && (
        <div className="pl-card-labels">
          {taskLabels.map(l => (
            <span key={l.id} className="pl-label-chip" style={{ background: l.color }} title={l.name} />
          ))}
        </div>
      )}

      {/* Priorité */}
      {task.priority !== 'medium' && (
        <div className="pl-card-prio" style={{ color: prio.color }}>
          <prio.Icon size={11} /> {prio.label}
        </div>
      )}

      <div className="pl-card-title">{task.title || <span className="t-muted">// sans titre</span>}</div>

      {/* Pied : meta */}
      <div className="pl-card-foot">
        <span className="pl-prog" style={{ color: prog.color }} title={prog.label}>
          <ProgIcon size={13} />
        </span>

        {chk && (
          <span className="pl-meta" title="Liste de contrôle">
            <ListChecks size={12} /> {chk.done}/{chk.total}
          </span>
        )}

        {task.notes && <span className="pl-meta" title="Notes"><MessageSquare size={12} /></span>}

        {task.dueDate && (
          <span className={`pl-meta pl-due-${due}`} title="Échéance">
            <Calendar size={12} /> {formatDue(task.dueDate)}
          </span>
        )}

        <span style={{ flex: 1 }} />

        {(task.assignees || []).slice(0, 3).map((a, i) => (
          <span key={i} className="pl-avatar" style={{ background: avatarColor(a) }} title={a}>
            {initials(a)}
          </span>
        ))}
        {(task.assignees || []).length > 3 && (
          <span className="pl-avatar pl-avatar-more">+{task.assignees.length - 3}</span>
        )}
      </div>
    </article>
  )
}
