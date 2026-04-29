import { Wrench } from 'lucide-react'

export default function Garage() {
  return (
    <div className="under-construction">
      <Wrench size={42} className="t-accent" />
      <div className="uc-title">[ GARAGE MODULE ]</div>
      <div className="uc-tape">// UNDER CONSTRUCTION — COMING SOON //</div>
      <div className="uc-sub">
        ÉQUIPEMENTS · ENTRETIENS · INVENTAIRE — Q3 2026
      </div>
    </div>
  )
}
