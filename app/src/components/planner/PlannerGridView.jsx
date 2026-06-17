import { PRIORITY_META, PROGRESS_META, checklistProgress, dueStatus, formatDue } from '../../utils/planner'

export default function PlannerGridView({ buckets, tasks, labels, onOpenTask }) {
  const rows = [...tasks].sort((a, b) => a.position - b.position)
  const bucketName = id => buckets.find(b => b.id === id)?.name || '—'

  if (!rows.length) return <div className="empty-state">// AUCUNE TÂCHE</div>

  return (
    <div className="pl-grid-wrap">
      <table className="pl-grid">
        <thead>
          <tr>
            <th>TITRE</th>
            <th>COMPARTIMENT</th>
            <th>PROGRESSION</th>
            <th>PRIORITÉ</th>
            <th>ÉCHÉANCE</th>
            <th>CHECKLIST</th>
            <th>ÉTIQUETTES</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(t => {
            const prog = PROGRESS_META[t.progress] || PROGRESS_META.notstarted
            const prio = PRIORITY_META[t.priority] || PRIORITY_META.medium
            const chk = checklistProgress(t.checklist)
            const due = dueStatus(t.dueDate, t.progress)
            const tLabels = (t.labels || []).map(id => labels.find(l => l.id === id)).filter(Boolean)
            return (
              <tr key={t.id} onClick={() => onOpenTask(t)}>
                <td className="pl-grid-title">{t.title || '// sans titre'}</td>
                <td>{bucketName(t.bucketId)}</td>
                <td><span style={{ color: prog.color }}><prog.Icon size={12} style={{ verticalAlign: 'middle' }} /> {prog.label}</span></td>
                <td><span style={{ color: prio.color }}><prio.Icon size={12} style={{ verticalAlign: 'middle' }} /> {prio.label}</span></td>
                <td className={t.dueDate ? `pl-due-${due}` : 't-muted'}>{t.dueDate ? formatDue(t.dueDate) : '—'}</td>
                <td>{chk ? `${chk.done}/${chk.total}` : '—'}</td>
                <td>
                  <span style={{ display: 'inline-flex', gap: 3 }}>
                    {tLabels.map(l => <span key={l.id} className="pl-label-chip" style={{ background: l.color }} title={l.name} />)}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
