import { Wrench, Workflow, FileText, CheckSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppLauncher from '../components/AppLauncher'

const URLS = {
  n8n: import.meta.env.VITE_URL_N8N || 'http://n8n.local',
  cv:  import.meta.env.VITE_URL_CV  || 'https://monCV.fr',
}

const APPS = [
  { name: 'GARAGE',   Icon: Wrench,       internal: true, meta: '// /garage',    route: '/garage' },
  { name: 'AUTOMATE', Icon: Workflow,      url: URLS.n8n,  meta: `// ${URLS.n8n}` },
  { name: 'CV',       Icon: FileText,      url: URLS.cv,   meta: `// ${URLS.cv}` },
  { name: 'TODO',     Icon: CheckSquare,   internal: true, meta: '// /todo',      route: '/todo' },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="dashboard">
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
