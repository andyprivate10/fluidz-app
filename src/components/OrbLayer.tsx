// OrbLayer — ambient drifting orbs for page backgrounds
// Usage: <OrbLayer /> as first child of any page wrapper (position: relative)
export default function OrbLayer() {
  return (
    <div className="orb-layer">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  )
}
