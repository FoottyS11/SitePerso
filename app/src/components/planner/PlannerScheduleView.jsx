import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PRIORITY_META } from '../../utils/planner'

const WEEKDAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function PlannerScheduleView({ tasks, onOpenTask }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const today = new Date()

  const cells = useMemo(() => {
    const year = cursor.getFullYear(), month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const startOffset = (first.getDay() + 6) % 7 // lundi = 0
    const start = new Date(year, month, 1 - startOffset)
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      const dayTasks = tasks.filter(t => t.dueDate && sameDay(new Date(t.dueDate), date))
      return { date, inMonth: date.getMonth() === month, tasks: dayTasks }
    })
  }, [cursor, tasks])

  const undated = tasks.filter(t => !t.dueDate)

  return (
    <div>
      <div className="row between" style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 18 }}>{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</h3>
        <div className="tabs">
          <button className="tab" onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))}><ChevronLeft size={13} /></button>
          <button className="tab" onClick={() => { const d = new Date(); d.setDate(1); setCursor(d) }}>AUJOURD'HUI</button>
          <button className="tab" onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))}><ChevronRight size={13} /></button>
        </div>
      </div>

      <div className="calendar">
        {WEEKDAYS.map(d => <div key={d} className="calendar-head">{d}</div>)}
        {cells.map((cell, i) => (
          <div key={i} className={`calendar-cell ${cell.inMonth ? '' : 'muted'} ${sameDay(cell.date, today) ? 'today' : ''}`}>
            <span className="day-num">{cell.date.getDate()}</span>
            {cell.tasks.slice(0, 4).map(t => {
              const prio = PRIORITY_META[t.priority] || PRIORITY_META.medium
              return (
                <div key={t.id} className="cal-task" style={{ color: prio.color }}
                  onClick={() => onOpenTask(t)} title={t.title}>
                  {t.title || '// sans titre'}
                </div>
              )
            })}
            {cell.tasks.length > 4 && <span className="t-muted" style={{ fontSize: 10 }}>+{cell.tasks.length - 4}</span>}
          </div>
        ))}
      </div>

      {undated.length > 0 && (
        <>
          <div className="section-title">// SANS ÉCHÉANCE · {undated.length}</div>
          <div className="task-list">
            {undated.map(t => (
              <div key={t.id} className="alert-item alert-ok" onClick={() => onOpenTask(t)}>
                <span className="alert-text">{t.title || '// sans titre'}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
