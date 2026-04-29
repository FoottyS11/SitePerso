import { PRIORITY_META } from '../utils/deadlines'

export default function PriorityBadge({ priority, compact = false }) {
  const meta = PRIORITY_META[priority] || PRIORITY_META.P3
  return (
    <span className={`priority-badge p-${priority}`}>
      {priority}{compact ? '' : ` ${meta.label}`}
    </span>
  )
}
