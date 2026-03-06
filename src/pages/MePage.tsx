import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import BottomNav from '../components/BottomNav'

const MORPHOLOGIES = ['Mince','Sportif','Athlétique','Moyen','Costaud','Musclé','Gros']
const ROLES = ['Top','Bottom','Versa','Side']
const PREP_OPTIONS = ['Actif','Inactif','Non']
const KINKS_LIST = [
  'Fist','SM léger','SM hard','Jeux de rôle','Fétichisme',
  'Exhib','Voyeur','Bareback','Gang bang','Cuir','Latex','Groupe','Watersports'
]

const S = {
  bg0:'#0C0A14', bg1:'#16141F', bg2:'#1F1D2B', bg3:'#2A2740',
  tx:'#F0EDFF', tx2:'#B8B2CC', tx3:'#7E7694', tx4:'#453F5C',
  border:'#2A2740', p300:'#F9A8A8', p400:'#F47272', red:'#F87171', green:'#4ADE80', blue:'#3B82F6',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

function monthsAgo(isoDate: string): number | null {
  if (!isoDate) return null
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  return Math.max(0, (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()))
}

const inputStyle: React.CSSProperties = {
  width:'100%', background:S.bg2, color:S.tx, borderRadius:14,
  padding:'12px 16px', border:`1px solid ${S.border}`, outline:'none',
  fontSize:14, fontFamily:'inherit', boxSizing:'border-box',
}

function Chip({ label, active, onClick }: { label:string; active:boolean; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{
      padding:'6px 14px', borderRadius:99, fontSize:13, fontWeight:600,
      border: active ? 'none' : `1px solid ${S.border}`,
      background: active ? S.grad : S.bg2,
      color: active ? '#fff' : S.tx3,
      cursor:'pointer', transition:'all 0.15s',
      boxShadow: active ? `0 2px 12px ${S.p400}44` : 'none',
    }}>
      {label}
    </button>
  )
}

function Section({ title, badge, children }: { title:string; badge?:string; children:React.ReactNode }) {
  return (
    <div style={{ background:S.bg1, borderRadius:20, padding:'16px', border:`1px solid ${S.border}`, marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <span style={{ fontSize:11, fontWeight:700, color:S.tx3, textTransform:'uppercase', letterSpacing:'0.08em' }}>
          {title}
        </span>
        {badge && (
          <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:99,
            background:`${S.p300}18`, color:S.p300, border:`1px solid ${S.p300}33` }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

export default function MePage() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'auth'|'profil'>('auth')

  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [role, setRole] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [morphology, setMorphology] = useState('')
  const [kinks, setKinks] = useState<string[]>([])
  const [prep, setPrep] = useState('')
  const [dernierTest, setDernierTest] = useState('')
  const [seroStatus, setSeroStatus] = useState('')
  const [limits, setLimits] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [hasGuestToken, setHasGuestToken] = useState(false)

  useEffect(() => {
    try {
      setHasGuestToken(!!(typeof localStorage !== 'undefined' && localStorage.getItem('guest_token')))
    } catch (_) {}
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) {
        loadProfile(u.id)
        try {
          const token = localStorage.getItem('guest_token')
          if (token) {
            supabase.rpc('claim_phantom', { p_guest_token: token }).catch(() => {})
            localStorage.removeItem('guest_token')
            localStorage.removeItem('guest_session_id')
            setHasGuestToken(false)
          }
        } catch (_) {}
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        loadProfile(u.id)
        try {
          const token = localStorage.getItem('guest_token')
          if (token) {
            supabase.rpc('claim_phantom', { p_guest_token: token }).catch(() => {})
            localStorage.removeItem('guest_token')
            localStorage.removeItem('guest_session_id')
            setHasGuestToken(false)
          }
        } catch (_) {}
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(uid: string) {
    const { data } = await supabase
      .from('user_profiles')
      .select('display_name,profile_json')
      .eq('id', uid)
      .maybeSingle()
    if (data) {
      setDisplayName(data.display_name || '')
      const p = data.profile_json || {}
      const h = p.health || {}
      setAvatarUrl(p.avatar_url || '')
      setAge(p.age || '')
      setBio(p.bio || '')
      setLocation(p.location || '')
      setRole(p.role || '')
      setHeight(p.height || '')
      setWeight(p.weight || '')
      setMorphology(p.morphology || '')
      setKinks(p.kinks || [])
      setPrep(h.prep_status || p.prep || '')
      setDernierTest(h.dernier_test || '')
      setSeroStatus(h.sero_status || '')
      setLimits(p.limits || '')
    }
  }

  async function sendMagicLink() {
    if (!email) return
    setLoading(true); setMsg('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/me' }
    })
    setMsg(error ? error.message : 'Lien envoyé ! Vérifie ta boîte mail.')
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setActiveTab('auth')
  }

  async function saveProfile() {
    if (!user) return
    setLoading(true)
    const profile_json = {
      age, bio, location, role, height, weight, morphology, kinks, prep, limits, avatar_url: avatarUrl || undefined,
      health: { prep_status: prep || undefined, dernier_test: dernierTest || undefined, sero_status: seroStatus || undefined },
    }
    await supabase.from('user_profiles').upsert({
      id: user.id,
      display_name: displayName || 'Anonyme',
      profile_json
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setLoading(false)
  }

  function toggleKink(k: string) {
    setKinks(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) return
    setAvatarUploading(true)
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${user.id}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) {
      setAvatarUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(publicUrl)
    setAvatarUploading(false)
    e.target.value = ''
  }

  // ── Non connecté ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={{
        minHeight:'100vh', background:S.bg0, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', padding:'0 24px 96px',
        fontFamily:'Inter,system-ui,sans-serif'
      }}>
        {hasGuestToken && (
          <div style={{ marginBottom:20, padding:14, borderRadius:14, background:S.p300+'18', border:'1px solid '+S.p300+'44', maxWidth:360, width:'100%' }}>
            <p style={{ margin:0, fontSize:13, color:S.tx, fontWeight:600 }}>Vous avez une candidature en attente — créer un compte pour la conserver.</p>
            <p style={{ margin:'8px 0 0', fontSize:12, color:S.tx2 }}>Connecte-toi avec ton email pour récupérer ta candidature.</p>
          </div>
        )}
        <div style={{ marginBottom:32, textAlign:'center' }}>
          <h1 style={{ fontSize:32, fontWeight:800, background:S.grad,
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 8px' }}>
            fluidz
          </h1>
          <p style={{ color:S.tx3, fontSize:14 }}>Entre ton email pour te connecter</p>
        </div>
        <input
          type="email" value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="ton@email.com"
          style={{ ...inputStyle, maxWidth:360, marginBottom:12 }}
          onKeyDown={e => e.key === 'Enter' && sendMagicLink()}
        />
        <button
          onClick={sendMagicLink} disabled={loading}
          style={{
            width:'100%', maxWidth:360, padding:'14px', borderRadius:14,
            fontWeight:700, fontSize:15, color:'#fff', background:S.grad,
            border:'none', cursor:'pointer', opacity: loading ? 0.7 : 1,
            boxShadow:`0 4px 20px ${S.p400}44`,
          }}>
          {loading ? 'Envoi...' : hasGuestToken ? 'Créer mon compte (lien magique)' : '✉️ Envoyer le lien magique'}
        </button>
        {msg && <p style={{ marginTop:16, fontSize:13, color:S.tx2, textAlign:'center' }}>{msg}</p>}
        <BottomNav active="me" />
      </div>
    )
  }

  // ── Connecté ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:S.bg0, paddingBottom:96, fontFamily:'Inter,system-ui,sans-serif' }}>

      {/* Header */}
      <div style={{
        padding:'40px 20px 16px', borderBottom:`1px solid ${S.border}`,
        display:'flex', alignItems:'center', justifyContent:'space-between'
      }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:S.tx, margin:0 }}>
            {displayName || 'Mon profil'}
          </h1>
          <p style={{ fontSize:12, color:S.tx3, marginTop:3 }}>{user.email}</p>
        </div>
        <button onClick={signOut} style={{
          padding:'7px 14px', borderRadius:10, fontSize:12, color:S.tx3,
          border:`1px solid ${S.border}`, background:'transparent', cursor:'pointer',
        }}>
          Déco
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', padding:'12px 20px 0', gap:8 }}>
        {(['auth','profil'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex:1, padding:'10px', borderRadius:12, fontSize:13,
            fontWeight:600, cursor:'pointer',
            border: `1px solid ${activeTab===tab ? `${S.p300}66` : S.border}`,
            background: activeTab===tab ? `${S.p300}14` : S.bg2,
            color: activeTab===tab ? S.p300 : S.tx3,
            transition:'all 0.2s',
          }}>
            {tab === 'auth' ? '🔐 Compte' : '👤 Profil'}
          </button>
        ))}
      </div>

      {/* ── Compte ── */}
      {activeTab === 'auth' && (
        <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ background:S.bg1, borderRadius:16, padding:'14px 16px', border:`1px solid ${S.border}` }}>
            <p style={{ fontSize:11, color:S.tx3, marginBottom:4, fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.06em' }}>Email</p>
            <p style={{ fontSize:14, color:S.tx, fontWeight:500 }}>{user.email}</p>
          </div>
          <button onClick={signOut} style={{
            width:'100%', padding:'13px', borderRadius:14, fontWeight:600,
            fontSize:14, color:S.tx2, border:`1px solid ${S.border}`,
            background:S.bg2, cursor:'pointer',
          }}>
            Se déconnecter
          </button>
        </div>
      )}

      {/* ── Profil ── */}
      {activeTab === 'profil' && (
        <div style={{ padding:'16px 20px' }}>

          <Section title="Photo de profil">
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <label style={{ cursor: avatarUploading ? 'wait' : 'pointer', position: 'relative' }}>
                <input type="file" accept="image/*" onChange={onAvatarChange} disabled={avatarUploading} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: 'white' }}>
                    {(displayName || '?')[0].toUpperCase()}
                  </div>
                )}
              </label>
              <div>
                <p style={{ fontSize: 13, color: S.tx2, margin: 0 }}>{avatarUploading ? 'Upload...' : 'Clique pour changer'}</p>
                <p style={{ fontSize: 11, color: S.tx3, marginTop: 4 }}>JPG, PNG. Affiché sur ton profil.</p>
              </div>
            </div>
          </Section>

          <Section title="Profil">
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Pseudo *</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Ton pseudo" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio courte..." rows={3} style={{ ...inputStyle, resize:'none', lineHeight:1.5 }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Âge</label>
                <input value={age} onChange={e => setAge(e.target.value)} placeholder="Âge" type="number" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Localisation</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Paris 11e, Bastille..." style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Taille (cm)</label>
                <input value={height} onChange={e => setHeight(e.target.value)} placeholder="175" type="number" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Poids (kg)</label>
                <input value={weight} onChange={e => setWeight(e.target.value)} placeholder="70" type="number" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Morphologie</label>
                <select value={morphology} onChange={e => setMorphology(e.target.value)} style={inputStyle}>
                  <option value="">— Choisir —</option>
                  {MORPHOLOGIES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Rôle</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {ROLES.map(r => (
                    <Chip key={r} label={r} active={role===r} onClick={() => setRole(role===r?'':r)} />
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Pratiques" badge={kinks.length > 0 ? `${kinks.length} sélectionnées` : undefined}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {KINKS_LIST.map(k => (
                <Chip key={k} label={k} active={kinks.includes(k)} onClick={() => toggleKink(k)} />
              ))}
            </div>
          </Section>

          <Section title="Santé" badge={prep === 'Actif' ? 'PrEP actif' : dernierTest ? `Testé il y a ${monthsAgo(dernierTest)} mois` : undefined}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
              {prep === 'Actif' && <span style={{ fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:99, background:S.green+'22', color:S.green, border:'1px solid '+S.green+'44' }}>PrEP actif</span>}
              {dernierTest && <span style={{ fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:99, background:S.blue+'22', color:S.blue, border:'1px solid '+S.blue+'44' }}>Testé il y a {monthsAgo(dernierTest)} mois</span>}
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              {PREP_OPTIONS.map(p => (
                <Chip key={p} label={p} active={prep===p} onClick={() => setPrep(prep===p?'':p)} />
              ))}
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Date dernier test</label>
              <input type="date" value={dernierTest} onChange={e => setDernierTest(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Statut séro (optionnel)</label>
              <input value={seroStatus} onChange={e => setSeroStatus(e.target.value)} placeholder="Optionnel" style={inputStyle} />
            </div>
          </Section>

          <Section title="Limites">
            <textarea
              value={limits} onChange={e => setLimits(e.target.value)}
              placeholder="Hard limits, no-go..." rows={3}
              style={{ ...inputStyle, resize:'none', lineHeight:1.5, borderColor:S.red }}
            />
            <p style={{ fontSize:11, color:S.red, marginTop:6, opacity:0.7 }}>
              Visible par le host et les membres votants
            </p>
          </Section>

          <button
            onClick={saveProfile} disabled={loading || !displayName}
            style={{
              width:'100%', padding:'15px', borderRadius:16, fontWeight:700,
              fontSize:15, color:'#fff', background:S.grad, border:'none',
              cursor: loading||!displayName ? 'not-allowed' : 'pointer',
              opacity: loading||!displayName ? 0.5 : 1,
              boxShadow:`0 4px 24px ${S.p400}44`,
              transition:'opacity 0.2s',
            }}>
            {saved ? '✓ Profil sauvegardé !' : loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>

        </div>
      )}

      <BottomNav active="me" />
    </div>
  )
}
