import { useMemo } from 'react'
import { PRIORITIES, PRIORITY_META, PROGRESSES, PROGRESS_META, dueStatus } from '../../utils/planner'

function BarRow({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div className="pl-bar-row">
      <span className="pl-bar-label">{label}</span>
      <div className="pl-bar-track">
        <div className="pl-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="pl-bar-val">{value}</span>
    </div>
  )
}

export default function PlannerChartsView({ buckets, tasks }) {
  const stats = useMemo(() => {
    const total = tasks.length
    const byProgress = PROGRESSES.map(p => ({ ...PROGRESS_META[p], value: tasks.filter(t => t.progress === p).length }))
    const byPriority = PRIORITIES.map(p => ({ ...PRIORITY_META[p], value: tasks.filter(t => t.priority === p).length }))
    const byBucket = buckets.map(b => ({ name: b.name, value: tasks.filter(t => t.bucketId === b.id).length }))
    const late = tasks.filter(t => dueStatus(t.dueDate, t.progress) === 'late').length
    const done = tasks.filter(t => t.progress === 'completed').length
    return { total, byProgress, byPriority, byBucket, late, done }
  }, [buckets, tasks])

  const max = Math.max(1, ...stats.byBucket.map(b => b.value))

  return (
    <div className="pl-charts">
      <div className="counter-bar">
        <span>TÂCHES: <strong>{stats.total}</strong></span>
        <span>· <strong>{stats.done}</strong> TERMINÉES</span>
        <span>· <strong>{stats.total - stats.done}</strong> RESTANTES</span>
        <span>· <strong style={{ color: 'var(--accent-red)' }}>{stats.late}</strong> EN RETARD</span>
        <span>· <strong>{stats.total ? Math.round((stats.done / stats.total) * 100) : 0}%</strong> AVANCEMENT</span>
      </div>

      <div className="grid-3" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">// PROGRESSION</span></div>
          {stats.byProgress.map(p => <BarRow key={p.label} label={p.label} value={p.value} total={stats.total} color={p.color} />)}
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">// PRIORITÉ</span></div>
          {stats.byPriority.map(p => <BarRow key={p.label} label={p.label} value={p.value} total={stats.total} color={p.color} />)}
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">// COMPARTIMENT</span></div>
          {stats.byBucket.length === 0
            ? <span className="t-muted">// aucun</span>
            : stats.byBucket.map(b => <BarRow key={b.name} label={b.name} value={b.value} total={max} color="var(--accent-red)" />)}
        </div>
      </div>
    </div>
  )
}
