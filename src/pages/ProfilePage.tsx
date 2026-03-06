import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const S = {
  bg0:'#0C0A14', bg1:'#16141F', bg2:'#1F1D2B', bg3:'#2A2740',
  tx:'#F0EDFF', tx2:'#B8B2CC', tx3:'#7E7694',
  border:'#2A2740', p300:'#F9A8A8', p400:'#F47272', red:'#F87171', green:'#4ADE80',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

const card: React.CSSProperties = { background:S.bg1, borderRadius:20, padding:16, border:'1px solid '+S.border, marginBottom:12 }
const label: React.CSSProperties = { fontSize:11, fontWeight:700, color:S.tx3, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    supabase
      .from('user_profiles')
      .select('display_name, profile_json')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data)
        setLoading(false)
      })
  }, [userId])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:S.bg0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,system-ui,sans-serif' }}>
      <p style={{ color:S.tx3 }}>Chargement...</p>
    </div>
  )

  if (!profile) return (
    <div style={{ minHeight:'100vh', background:S.bg0, padding:24, fontFamily:'Inter,system-ui,sans-serif' }}>
      <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', color:S.tx3, fontSize:13, cursor:'pointer', padding:0 }}>← Retour</button>
      <p style={{ color:S.red, marginTop:16 }}>Profil introuvable.</p>
    </div>
  )

  const p = profile.profile_json || {}
  const kinks: string[] = p.kinks || []

  return (
    <div style={{ minHeight:'100vh', background:S.bg0, paddingBottom:96, fontFamily:'Inter,system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ padding:'40px 20px 20px', borderBottom:'1px solid '+S.border }}>
        <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', color:S.tx3, fontSize:13, cursor:'pointer', padding:0, marginBottom:16 }}>← Retour</button>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          {p.avatar_url ? (
            <img src={p.avatar_url} alt="" style={{ width:56, height:56, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
          ) : (
            <div style={{ width:56, height:56, borderRadius:'28%', background:S.grad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:700, color:'white', flexShrink:0 }}>
              {(profile.display_name || '?')[0].toUpperCase()}
            </div>
          )}
          <div>
            <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:S.tx }}>{profile.display_name || 'Anonyme'}</h1>
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              {p.age && <span style={{ fontSize:13, color:S.tx3 }}>{p.age} ans</span>}
              {p.age && p.location && <span style={{ fontSize:13, color:S.tx3 }}>·</span>}
              {p.location && <span style={{ fontSize:13, color:S.tx3 }}>{p.location}</span>}
            </div>
          </div>
        </div>
        {p.role && (
          <span style={{ display:'inline-block', marginTop:12, padding:'4px 14px', borderRadius:99, fontSize:13, fontWeight:600, color:'white', background:S.grad }}>
            {p.role}
          </span>
        )}
      </div>

      <div style={{ padding:'16px 20px' }}>
        {/* Bio */}
        {p.bio && (
          <div style={card}>
            <div style={label}>Bio</div>
            <p style={{ fontSize:14, color:S.tx2, lineHeight:1.6, margin:0 }}>{p.bio}</p>
          </div>
        )}

        {/* Physique */}
        {(p.height || p.weight || p.morphology) && (
          <div style={card}>
            <div style={label}>Physique</div>
            <div style={{ display:'flex', gap:16 }}>
              {p.height && (
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:20, fontWeight:700, color:S.tx }}>{p.height}</div>
                  <div style={{ fontSize:11, color:S.tx3 }}>cm</div>
                </div>
              )}
              {p.weight && (
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:20, fontWeight:700, color:S.tx }}>{p.weight}</div>
                  <div style={{ fontSize:11, color:S.tx3 }}>kg</div>
                </div>
              )}
              {p.morphology && (
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:14, fontWeight:600, color:S.tx }}>{p.morphology}</div>
                  <div style={{ fontSize:11, color:S.tx3 }}>morpho</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pratiques */}
        {kinks.length > 0 && (
          <div style={card}>
            <div style={label}>Pratiques ({kinks.length})</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {kinks.map((k: string) => (
                <span key={k} style={{ padding:'4px 12px', borderRadius:99, fontSize:12, fontWeight:600, color:S.tx2, background:S.bg2, border:'1px solid '+S.border }}>
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sante */}
        {p.prep && (
          <div style={card}>
            <div style={label}>Sante</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background: p.prep === 'Actif' ? S.green : '#FBBF24' }} />
              <span style={{ fontSize:14, fontWeight:600, color:S.tx }}>PrEP {p.prep}</span>
            </div>
          </div>
        )}

        {/* Limites */}
        {p.limits && (
          <div style={{ ...card, borderColor:S.red+'55' }}>
            <div style={{ ...label, color:S.red }}>Hard limits</div>
            <p style={{ fontSize:14, color:S.tx2, lineHeight:1.6, margin:0 }}>{p.limits}</p>
          </div>
        )}
      </div>
    </div>
  )
}
