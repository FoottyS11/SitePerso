import { useMemo } from 'react'
import { Wrench, Workflow, FileText, CheckSquare, AlertTriangle, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppLauncher from '../components/AppLauncher'
import { useTodos } from '../hooks/useTodos'
import { useReminders } from '../hooks/useReminders'
import { effectiveDeadline, deadlineStatus, relativeFromNow } from '../utils/deadlines'

const URLS = {
  n8n: import.meta.env.VITE_URL_N8N || 'http://n8n.local',
  cv:  import.meta.env.VITE_URL_CV  || 'https://monCV.fr',
}

const APPS = [
  { name: 'TODO',     Icon: CheckSquare,   internal: true, meta: '// /todo',      route: '/todo' },
  { name: 'GARAGE',   Icon: Wrench,        internal: true, meta: '// /garage',    route: '/garage' },
  { name: 'AUTOMATE', Icon: Workflow,       url: URLS.n8n,  meta: `// ${URLS.n8n}` },
  { name: 'CV',       Icon: FileText,       url: URLS.cv,   meta: `// ${URLS.cv}` },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { todos } = useTodos()
  useReminders(todos)

  const { alerts, upcoming } = useMemo(() => {
    const active = todos
      .filter(t => t.status === 'todo')
      .map(t => {
        const dl = effectiveDeadline(t)
        return { ...t, _dl: dl, _status: deadlineStatus(dl.date) }
      })
      .sort((a, b) => {
        const order = { late: 0, near: 1, ok: 2 }
        if (order[a._status] !== order[b._status]) return order[a._status] - order[b._status]
        return a._dl.date - b._dl.date
      })

    const alerts = active
      .filter(t => t._status === 'late' || t._status === 'near' || t.priority === 'P1')
      .slice(0, 6)

    const alertIds = new Set(alerts.map(t => t.id))
    const upcoming = active
      .filter(t => !alertIds.has(t.id))
      .slice(0, 5)

    return { alerts, upcoming }
  }, [todos])

  return (
    <div className="dashboard">
      {alerts.length > 0 && (
        <>
          <div className="section-title" style={{ color: 'var(--accent-red)' }}>
            <AlertTriangle size={13} style={{ marginRight: 4 }} />
            ALERTS · {alerts.length}
          </div>
          <div className="alert-list">
            {alerts.map(t => (
              <div
                key={t.id}
                className={`alert-item alert-${t._status === 'late' ? 'late' : t._status === 'near' ? 'near' : 'p1'}`}
                onClick={() => navigate('/todo')}
              >
                <span className={`p-${t.priority}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em' }}>
                  {t.priority}
                </span>
                <span className="alert-text">{t.text || '(sans titre)'}</span>
                <span className={`deadline-tag ${t._status === 'late' ? 'deadline-late' : 'deadline-near'}`}>
                  {relativeFromNow(t._dl.date)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <div className="section-title">
            <Clock size={13} style={{ marginRight: 4 }} />
            RAPPELS · {upcoming.length}
          </div>
          <div className="alert-list">
            {upcoming.map(t => (
              <div
                key={t.id}
                className="alert-item alert-ok"
                onClick={() => navigate('/todo')}
              >
                <span className={`p-${t.priority}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em' }}>
                  {t.priority}
                </span>
                <span className="alert-text">{t.text || '(sans titre)'}</span>
                <span className="deadline-tag" style={{ color: 'var(--text-secondary)' }}>
                  {relativeFromNow(t._dl.date)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-title">// APPS</div>
      <div className="launcher-grid">
        {APPS.map(({ name, Icon, url, internal, meta, route }) => (
          <AppLauncher
            key={name}
            name={name}
            icon={<Icon size={24} />}
            url={url}
            internal={internal}
            meta={meta}
            onClick={route ? () => navigate(route) : undefined}
          />
        ))}
      </div>
    </div>
  )
}
