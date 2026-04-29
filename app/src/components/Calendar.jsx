import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { effectiveDeadline, PRIORITY_META } from '../utils/deadlines'

const WEEKDAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']
const MONTHS = ['JANVIER','FÉVRIER','MARS','AVRIL','MAI','JUIN','JUILLET','AOÛT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DÉCEMBRE']

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/**
 * Calendrier mensuel — CSS Grid 7 colonnes, sans dépendance externe.
 */
export default function Calendar({ todos, onTaskClick }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const today = new Date()

  const days = useMemo(() => {
    const first = startOfMonth(cursor)
    // semaine commence lundi
    const lead = (first.getDay() + 6) % 7
    const start = new Date(first)
    start.setDate(start.getDate() - lead)
    const cells = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      cells.push(d)
    }
    return cells
  }, [cursor])

  const tasksByDay = useMemo(() => {
    const map = new Map()
    todos.forEach(t => {
      if (t.status !== 'todo') return
      const { date } = effectiveDeadline(t)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(t)
      if (t.reminder) {
        const r = new Date(t.reminder)
        const rk = `${r.getFullYear()}-${r.getMonth()}-${r.getDate()}`
        if (rk !== key) {
          if (!map.has(rk)) map.set(rk, [])
          map.get(rk).push(t)
        }
      }
    })
    return map
  }, [todos])

  function shift(delta) {
    setCursor(c => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }

  return (
    <section>
      <div className="row between" style={{ marginBottom: 14 }}>
        <h3 className="t-display" style={{ fontSize: 18 }}>
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </h3>
        <div className="row gap-sm">
          <button className="btn btn-ghost btn-icon" onClick={() => shift(-1)} aria-label="Mois précédent">
            <ChevronLeft size={14} />
          </button>
          <button className="btn btn-ghost" onClick={() => setCursor(startOfMonth(new Date()))}>
            TODAY
          </button>
          <button className="btn btn-ghost btn-icon" onClick={() => shift(1)} aria-label="Mois suivant">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="calendar">
        {WEEKDAYS.map(w => <div key={w} className="calendar-head">{w}</div>)}
        {days.map((d, i) => {
          const inMonth = d.getMonth() === cursor.getMonth()
          const isToday = sameDay(d, today)
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
          const dayTasks = tasksByDay.get(key) || []
          return (
            <div key={i} className={`calendar-cell ${inMonth ? '' : 'muted'} ${isToday ? 'today' : ''}`}>
              <span className="day-num">{String(d.getDate()).padStart(2, '0')}</span>
              {dayTasks.slice(0, 3).map(t => (
                <div
                  key={t.id}
                  className="cal-task"
                  style={{ color: PRIORITY_META[t.priority]?.color }}
                  onClick={(e) => { e.stopPropagation(); onTaskClick?.(t) }}
                  title={t.text}
                >
                  {t.text || '(untitled)'}
                </div>
              ))}
              {dayTasks.length > 3 && (
                <span className="t-muted" style={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                  +{dayTasks.length - 3} more
                </span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
