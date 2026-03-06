import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { seedAll, clearAll, TEST_INVITE_CODE } from '../lib/seedTestData'

const S = {
  bg0: '#0C0A14', bg1: '#16141F', border: '#2A2740',
  tx: '#F0EDFF', tx2: '#B8B2CC', tx3: '#7E7694',
  green: '#4ADE80', red: '#F87171',
}

const TEST_PASSWORD = 'testpass123'

export default function DevTestMenu() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dev = searchParams.get('dev') === '1'
  const [seeding, setSeeding] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [msg, setMsg] = useState('')

  if (!dev) {
    return (
      <div style={{ minHeight: '100vh', background: S.bg0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif' }}>
        <p style={{ color: S.tx3 }}>Accès réservé. Ajoute ?dev=1 à l’URL.</p>
      </div>
    )
  }

  async function loginAs(email: string) {
    setMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: TEST_PASSWORD })
    setMsg(error ? error.message : `Connecté : ${email}`)
    if (!error) setTimeout(() => setMsg(''), 2000)
  }

  async function handleSeed() {
    setSeeding(true)
    setMsg('')
    try {
      await seedAll()
      setMsg('Données seedées.')
    } catch (e) {
      setMsg(String(e))
    }
    setSeeding(false)
  }

  async function handleClear() {
    setClearing(true)
    setMsg('')
    try {
      await clearAll()
      setMsg('Données reset.')
    } catch (e) {
      setMsg(String(e))
    }
    setClearing(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: S.bg0, padding: 24, paddingBottom: 96, fontFamily: 'Inter,sans-serif' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: S.tx, marginBottom: 24 }}>🧪 Dev Test Menu</h1>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: S.tx3, marginBottom: 8 }}>Connexion rapide</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => loginAs('host@fluidz.test')} style={{ padding: 12, borderRadius: 12, border: '1px solid ' + S.border, background: S.bg1, color: S.tx, fontSize: 14, cursor: 'pointer', textAlign: 'left' }}>
            Se connecter en HOST (Marcus)
          </button>
          <button onClick={() => loginAs('member@fluidz.test')} style={{ padding: 12, borderRadius: 12, border: '1px solid ' + S.border, background: S.bg1, color: S.tx, fontSize: 14, cursor: 'pointer', textAlign: 'left' }}>
            Se connecter en MEMBER (Karim)
          </button>
          <button onClick={() => loginAs('guest@fluidz.test')} style={{ padding: 12, borderRadius: 12, border: '1px solid ' + S.border, background: S.bg1, color: S.tx, fontSize: 14, cursor: 'pointer', textAlign: 'left' }}>
            Se connecter en GUEST (Yann)
          </button>
          <button onClick={() => navigate('/join/' + TEST_INVITE_CODE)} style={{ padding: 12, borderRadius: 12, border: '1px solid ' + S.border, background: S.bg1, color: S.tx, fontSize: 14, cursor: 'pointer', textAlign: 'left' }}>
            Mode GHOST (sans compte)
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: S.tx3, marginBottom: 8 }}>Données</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSeed} disabled={seeding} style={{ padding: 12, borderRadius: 12, border: 'none', background: S.green + '33', color: S.green, fontSize: 14, fontWeight: 600, cursor: seeding ? 'not-allowed' : 'pointer' }}>
            {seeding ? 'Seed...' : 'Seeder les données'}
          </button>
          <button onClick={handleClear} disabled={clearing} style={{ padding: 12, borderRadius: 12, border: 'none', background: S.red + '33', color: S.red, fontSize: 14, fontWeight: 600, cursor: clearing ? 'not-allowed' : 'pointer' }}>
            {clearing ? 'Reset...' : 'Reset données'}
          </button>
        </div>
      </div>

      {msg && <p style={{ fontSize: 13, color: msg.startsWith('Connecté') || msg === 'Données seedées.' || msg === 'Données reset.' ? S.green : S.red }}>{msg}</p>}
    </div>
  )
}
