export default function Logo({ flicker = false, size = 18 }) {
  return (
    <span className={`logo ${flicker ? 'logo-flicker' : ''}`} style={{ fontSize: size }}>
      <span className="logo-mark" />
      <span>CTRL_HUB</span>
    </span>
  )
}
