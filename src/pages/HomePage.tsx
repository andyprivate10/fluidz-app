import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()
  return (
    <div
      style={{
        background: '#0C0A14',
        padding: 24,
        maxWidth: 390,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        minHeight: '100vh',
        justifyContent: 'center',
        paddingBottom: 80,
      }}
    >
      <h1
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#F9A8A8',
          margin: 0,
        }}
      >
        fluidz
      </h1>
      <p
        style={{
          color: '#B8B2CC',
          fontSize: 14,
          margin: 0,
        }}
      >
        Plans de groupe ce soir
      </p>
      <button
        type="button"
        className="btn-primary"
        style={{
          padding: 14,
          borderRadius: 12,
        }}
        onClick={() => navigate('/session/create')}
      >
        Créer une session
      </button>
      <button
        type="button"
        className="btn-secondary"
        style={{
          padding: 14,
          borderRadius: 12,
        }}
        onClick={() => navigate('/join')}
      >
        Rejoindre avec un lien
      </button>
    </div>
  );
}
