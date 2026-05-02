import { PRIORITY_META } from '../utils/deadlines'

export default function PriorityBadge({ priority, compact = false }) {
  if (!priority) return null
  const meta = PRIORITY_META[priority]
  return (
    <span className={`priority-badge p-${priority}`}>
      {priority}{compact ? '' : ` ${meta.label}`}
    </span>
  )
}
