export default function OrbLayer() {
  return (
    <div style={{
      position:'absolute', inset:0,
      pointerEvents:'none', overflow:'hidden', zIndex:0
    }}>
      <div style={{
        position:'absolute', width:260, height:260,
        top:-90, left:-60, borderRadius:'50%',
        filter:'blur(60px)',
        background:'rgba(224,136,122,0.10)',
        animation:'orbDrift1 11s ease-in-out infinite'
      }}/>
      <div style={{
        position:'absolute', width:200, height:200,
        top:50, right:-70, borderRadius:'50%',
        filter:'blur(60px)',
        background:'rgba(144,128,186,0.08)',
        animation:'orbDrift2 14s ease-in-out infinite'
      }}/>
      <div style={{
        position:'absolute', width:170, height:170,
        bottom:60, left:-30, borderRadius:'50%',
        filter:'blur(60px)',
        background:'rgba(107,168,136,0.06)',
        animation:'orbDrift3 17s ease-in-out infinite 3s'
      }}/>
    </div>
  )
}
