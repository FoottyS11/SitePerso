import { ExternalLink, ArrowRight } from 'lucide-react'

/**
 * Card cliquable de la grille launcher.
 * @param {{ name, icon: ReactNode, url?: string, internal?: boolean, meta?: string, onClick?: () => void }} props
 */
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
      <div className="row between">
        <div className="launcher-icon">{icon}</div>
        {isExternal ? <ExternalLink size={14} className="t-dim" /> : <ArrowRight size={14} className="t-dim" />}
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
