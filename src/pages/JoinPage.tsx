import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const S = {
  bg0:'#0C0A14',bg1:'#16141F',bg2:'#1F1D2B',
  tx:'#F0EDFF',tx3:'#7E7694',tx4:'#453F5C',
  border:'#2A2740',p300:'#F9A8A8',p400:'#F47272',green:'#4ADE80',red:'#F87171',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

export default function JoinPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [status, setStatus] = useState<'loading'|'found'|'error'|'joining'>('loading')
  const [msg, setMsg] = useState('')
  const [joinError, setJoinError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
    if (code) lookupSession()
  }, [code])

  async function lookupSession() {
    const { data } = await supabase.from('sessions').select('id,title,approx_area,status,host_id').eq('invite_code', code).maybeSingle()
    if (data) { setSession(data); setStatus('found') }
    else setStatus('error')
  }

  async function join() {
    if (!user) { navigate('/me'); return }
    if (!session) return
    setStatus('joining')
    setJoinError('')
    await supabase.from('applications').upsert({ session_id: session.id, applicant_id: user.id, status: 'pending', eps_json: {} })
    setMsg('Candidature envoyée !')
    setTimeout(() => navigate('/session/' + session.id + '/dm'), 1200)
  }

  async function joinAsGuest() {
    if (!session) return
    setStatus('joining')
    setJoinError('')
    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously()
    if (anonError) {
      setStatus('found')
      setJoinError(anonError.message || 'Connexion anonyme indisponible. Connecte-toi pour postuler.')
      return
    }
    const anonUser = anonData?.user
    if (!anonUser) {
      setStatus('found')
      setJoinError('Erreur lors de la création du profil invité.')
      return
    }
    await supabase.from('user_profiles').upsert({
      id: anonUser.id,
      display_name: 'Invité',
      profile_json: {},
    })
    await supabase.from('applications').upsert({
      session_id: session.id,
      applicant_id: anonUser.id,
      status: 'pending',
      eps_json: {},
    })
    setUser(anonUser)
    setMsg('Candidature envoyée ! Tu es connecté en tant qu\'invité.')
    setTimeout(() => navigate('/session/' + session.id + '/dm'), 1200)
  }

  return (
    <div style={{minHeight:'100vh',background:S.bg0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 24px',fontFamily:'Inter,system-ui,sans-serif'}}>
      {status === 'loading' && <p style={{color:S.tx3}}>Vérification du lien...</p>}

      {status === 'error' && (
        <div style={{textAlign:'center'}}>
          <p style={{fontSize:40,marginBottom:8}}>🚫</p>
          <p style={{color:S.tx,fontWeight:700,fontSize:18,marginBottom:8}}>Lien invalide</p>
          <p style={{color:S.tx3,fontSize:14,marginBottom:24}}>Ce lien d'invitation n'existe pas ou a expiré</p>
          <button onClick={()=>navigate('/')} style={{padding:'12px 24px',borderRadius:12,background:S.grad,color:'#fff',border:'none',fontWeight:700,cursor:'pointer'}}>Retour</button>
        </div>
      )}

      {status === 'found' && session && (
        <div style={{width:'100%',maxWidth:380}}>
          <div style={{background:S.bg1,borderRadius:20,padding:'24px',border:'1px solid '+S.border,marginBottom:16}}>
            <p style={{fontSize:24,margin:'0 0 4px',textAlign:'center'}}>🔥</p>
            <h1 style={{fontSize:20,fontWeight:800,color:S.tx,textAlign:'center',margin:'0 0 8px'}}>{session.title}</h1>
            <p style={{fontSize:13,color:S.tx3,textAlign:'center',margin:'0 0 16px'}}>📍 {session.approx_area}</p>
            <div style={{padding:'10px 14px',background:S.bg0,borderRadius:12,border:'1px solid '+S.border}}>
              <p style={{fontSize:12,color:S.tx3,margin:0,textAlign:'center'}}>🔒 Adresse révélée après acceptation</p>
            </div>
          </div>
          {msg ? (
            <p style={{color:S.green,textAlign:'center',fontWeight:700,fontSize:15}}>{msg}</p>
          ) : !user ? (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <button onClick={()=>navigate('/me')} style={{width:'100%',padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',cursor:'pointer',boxShadow:'0 4px 20px '+S.p400+'44'}}>
                Se connecter pour postuler
              </button>
              <button onClick={() => {
                const token = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
                try { localStorage.setItem('guest_token', token); localStorage.setItem('guest_session_id', session.id) } catch (_) {}
                navigate('/session/' + session.id + '/apply?guest_token=' + encodeURIComponent(token))
              }} style={{width:'100%',padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:S.tx,border:'1px solid '+S.border,background:'transparent',cursor:'pointer'}}>
                Continuer sans compte
              </button>
              <button onClick={joinAsGuest} disabled={status==='joining'} style={{width:'100%',padding:'12px',borderRadius:14,fontWeight:600,fontSize:14,color:S.tx3,border:'1px solid '+S.border,background:S.bg1,cursor:'pointer'}}>
                {status==='joining' ? 'Envoi...' : 'Postuler direct en invité'}
              </button>
              {joinError && <p style={{fontSize:13,color:S.red,textAlign:'center',margin:0}}>{joinError}</p>}
            </div>
          ) : (
            <button onClick={join} disabled={status==='joining'} style={{width:'100%',padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',cursor:'pointer',boxShadow:'0 4px 20px '+S.p400+'44'}}>
              {status==='joining' ? 'Envoi...' : 'Postuler 🔥'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}