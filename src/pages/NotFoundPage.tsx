import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div
      style={{
        background: '#0C0A14',
        padding: 24,
        maxWidth: 480,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        minHeight: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 80,
      }}
    >
      <div style={{ fontSize: 48 }}>404</div>
      <p style={{ color: '#B8B2CC', fontSize: 16, margin: 0, textAlign: 'center' }}>
        Page introuvable
      </p>
      <button
        type="button"
        className="btn-secondary"
        style={{ padding: 14, borderRadius: 12 }}
        onClick={() => navigate('/')}
      >
        Retour à l'accueil
      </button>
    </div>
  )
}
