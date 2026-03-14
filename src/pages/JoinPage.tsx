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
  const [lineup, setLineup] = useState<{ applicant_id: string; avatar_url?: string; display_name?: string; role?: string }[]>([])
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
    const { data: sess } = await supabase.from('sessions').select('id,title,approx_area,status,host_id,tags').eq('invite_code', code).maybeSingle()
    if (!sess) { setStatus('error'); return }
    setSession(sess)
    const { data: accepted } = await supabase.from('applications').select('applicant_id').eq('session_id', sess.id).in('status', ['accepted', 'checked_in'])
    const ids = (accepted || []).map((a: { applicant_id: string }) => a.applicant_id)
    if (ids.length > 0) {
      const { data: profiles } = await supabase.from('user_profiles').select('id, display_name, profile_json').in('id', ids)
      const list = (profiles || []).map((p: { id: string; display_name?: string; profile_json?: { avatar_url?: string; role?: string } }) => ({
        applicant_id: p.id,
        display_name: p.display_name,
        avatar_url: p.profile_json?.avatar_url,
        role: p.profile_json?.role,
      }))
      setLineup(list)
    }
    setStatus('found')
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
            <p style={{fontSize:13,color:S.tx3,textAlign:'center',margin:'0 0 8px'}}>📍 {session.approx_area}</p>
            {session.tags && session.tags.length > 0 && (
              <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center',marginBottom:12}}>
                {session.tags.map((tag: string) => (
                  <span key={tag} style={{fontSize:12,fontWeight:600,color:S.p300,padding:'4px 10px',borderRadius:99,background:S.p300+'18',border:'1px solid '+S.p300+'44'}}>{tag}</span>
                ))}
              </div>
            )}
            {lineup.length > 0 && (
              <div style={{marginBottom:12}}>
                <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.05em',margin:'0 0 8px',textAlign:'center'}}>Lineup · {lineup.length}</p>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {lineup.slice(0, 5).map((m) => (
                    <div key={m.applicant_id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:S.bg0,borderRadius:12,border:'1px solid '+S.border}}>
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt="" style={{width:32,height:32,borderRadius:'28%',objectFit:'cover',border:'1px solid '+S.border,flexShrink:0}} />
                      ) : (
                        <div style={{width:32,height:32,borderRadius:'28%',background:S.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',flexShrink:0}}>
                          {(m.display_name || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{margin:0,fontSize:13,fontWeight:600,color:S.tx}}>{m.display_name || 'Anonyme'}</p>
                        {m.role && <p style={{margin:0,fontSize:11,color:S.p300}}>{m.role}</p>}
                      </div>
                    </div>
                  ))}
                  {lineup.length > 5 && <p style={{fontSize:12,color:S.tx3,textAlign:'center',margin:'4px 0 0'}}>+{lineup.length - 5} autres</p>}
                </div>
              </div>
            )}
            <div style={{padding:'10px 14px',background:S.bg0,borderRadius:12,border:'1px solid '+S.border}}>
              <p style={{fontSize:12,color:S.tx3,margin:0,textAlign:'center'}}>🔒 Adresse révélée après acceptation</p>
            </div>
          </div>
          {msg ? (
            <p style={{color:S.green,textAlign:'center',fontWeight:700,fontSize:15}}>{msg}</p>
          ) : !user ? (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <button onClick={() => navigate('/me?next=/join/' + code)} style={{width:'100%',padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',cursor:'pointer',boxShadow:'0 4px 20px '+S.p400+'44'}}>
                Postuler →
              </button>
              <button onClick={() => {
                const token = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
                try { localStorage.setItem('guest_token', token); localStorage.setItem('guest_session_id', session.id) } catch (_) {}
                navigate('/session/' + session.id + '/apply?guest_token=' + encodeURIComponent(token))
              }} style={{width:'100%',padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:S.tx,border:'1px solid '+S.border,background:'transparent',cursor:'pointer'}}>
                👻 Sans compte
              </button>
              {joinError && <p style={{fontSize:13,color:S.red,textAlign:'center',margin:0}}>{joinError}</p>}
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <button onClick={() => navigate('/session/' + session.id + '/apply')} style={{width:'100%',padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',cursor:'pointer',boxShadow:'0 4px 20px '+S.p400+'44'}}>
                Postuler →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}