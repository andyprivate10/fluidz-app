import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div style={{
      minHeight:'100vh', background:'#0C0A14', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', padding:24,
      fontFamily:'Inter,system-ui,sans-serif', position:'relative', overflow:'hidden',
    }}>
      <div style={{
        position:'absolute', top:'20%', left:'50%', transform:'translateX(-50%)',
        width:300, height:300, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(249,168,168,0.04) 0%, transparent 70%)',
        pointerEvents:'none',
      }} />
      <div className="animate-fade-in" style={{textAlign:'center',position:'relative',zIndex:1}}>
        <p style={{fontSize:72,fontWeight:800,color:'#F9A8A8',margin:'0 0 8px',lineHeight:1}}>404</p>
        <p style={{fontSize:18,fontWeight:700,color:'#F0EDFF',marginBottom:8}}>Page introuvable</p>
        <p style={{fontSize:14,color:'#7E7694',marginBottom:32,lineHeight:1.5}}>Ce lien ne mène nulle part.<br />Peut-être qu'il a expiré.</p>
        <button onClick={() => navigate('/')} style={{
          padding:'14px 32px', borderRadius:14, fontWeight:700, fontSize:15,
          color:'#fff', background:'linear-gradient(135deg,#F9A8A8,#F47272)',
          border:'none', cursor:'pointer', boxShadow:'0 4px 20px rgba(244,114,114,0.25)',
        }}>
          Retour à l'accueil
        </button>
      </div>
    </div>
  )
}
