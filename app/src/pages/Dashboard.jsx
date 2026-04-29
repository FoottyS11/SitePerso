import { Wrench, Workflow, FileText, CheckSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppLauncher from '../components/AppLauncher'
import TodoWidget from '../components/TodoWidget'
import { useTodos } from '../hooks/useTodos'

const URLS = {
  garage: import.meta.env.VITE_URL_GARAGE || 'http://garage.local',
  n8n:    import.meta.env.VITE_URL_N8N    || 'http://n8n.local',
  cv:     import.meta.env.VITE_URL_CV     || 'https://monCV.fr'
}

export default function Dashboard() {
  const { todos } = useTodos()
  const navigate = useNavigate()

  return (
    <div>
      <div className="section-title">// APPS LAUNCHER</div>
      <div className="grid-3">
        <AppLauncher
          name="GARAGE"
          icon={<Wrench size={22} />}
          internal
          meta="// internal · /garage"
          onClick={() => navigate('/garage')}
        />
        <AppLauncher
          name="AUTOMATE"
          icon={<Workflow size={22} />}
          url={URLS.n8n}
          meta={`// ${URLS.n8n}`}
        />
        <AppLauncher
          name="CV"
          icon={<FileText size={22} />}
          url={URLS.cv}
          meta={`// ${URLS.cv}`}
        />
        <AppLauncher
          name="TODO"
          icon={<CheckSquare size={22} />}
          internal
          meta="// internal · /todo"
          onClick={() => navigate('/todo')}
        />
      </div>

      <div className="section-title">// QUICK STATUS</div>
      <div className="grid-2">
        <TodoWidget todos={todos} />
        <section className="card">
          <div className="card-header">
            <span className="card-title">// SYSTEM</span>
            <span className="t-label" style={{ color: 'var(--online)' }}>● NOMINAL</span>
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            <li className="row between"><span className="t-dim">DASHBOARD</span><span style={{ color: 'var(--online)' }}>OK</span></li>
            <li className="row between"><span className="t-dim">AUTH</span><span style={{ color: 'var(--warning)' }}>MOCK</span></li>
            <li className="row between"><span className="t-dim">REVERSE PROXY</span><span className="t-muted">N/A</span></li>
            <li className="row between"><span className="t-dim">BACKEND</span><span className="t-muted">PENDING</span></li>
          </ul>
          <div className="divider" />
          <p className="t-label" style={{ lineHeight: 1.6 }}>
            // future apps will be plugged here.<br/>
            // architecture: add a route + a card.
          </p>
        </section>
      </div>
    </div>
  )
}
