import { ExternalLink, ArrowRight } from 'lucide-react'

export default function AppLauncher({ name, icon, url, internal, meta, onClick }) {
  const isExternal = !!url && !internal

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    }
  }

  const content = (
    <>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div className="launcher-icon">{icon}</div>
        {isExternal
          ? <ExternalLink size={14} className="t-dim" style={{ marginTop: 2 }} />
          : <ArrowRight   size={14} className="t-dim" style={{ marginTop: 2 }} />
        }
      </div>
      <div>
        <div className="launcher-name">{name}</div>
        {meta && <div className="launcher-meta">{meta}</div>}
      </div>
    </>
  )

  if (isExternal) {
    return (
      <a className="launcher" href={url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    )
  }
  return (
    <a className="launcher" href={url || '#'} onClick={handleClick}>
      {content}
    </a>
  )
}
