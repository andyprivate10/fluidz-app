import { useState, useEffect } from 'react'

const S = {
  bg0: '#0C0A14',
  bg1: '#16141F',
  border: '#2A2740',
  tx: '#F0EDFF',
  tx2: '#B8B2CC',
  tx3: '#7E7694',
  green: '#4ADE80',
  red: '#F87171',
}

const BRIDGE_URL = 'http://localhost:3333/feedback'

const COMMANDS = [
  { label: 'Tuer process', cmd: 'pkill -f bridge.mjs; pkill -f "http.server 8080"' },
  { label: 'Lancer bridge', cmd: 'node /tmp/bridge.mjs &' },
  { label: 'Lancer dashboard', cmd: 'cd ~/Downloads && python3 -m http.server 8080 &' },
  { label: 'Lancer batch Cursor', cmd: 'cat /tmp/next_batch.md' },
]
const RELANCER_CMD = 'pkill -f bridge.mjs; sleep 1; node /tmp/bridge.mjs & sleep 1; cd ~/Downloads && python3 -m http.server 8080 &'

export default function DevLoopPage() {
  const [bridgeOk, setBridgeOk] = useState<boolean | null>(null)
  const [lastFeedback, setLastFeedback] = useState<{ summary?: string; done?: boolean; at?: string } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(BRIDGE_URL, { method: 'GET', signal: AbortSignal.timeout(3000) })
        setBridgeOk(true)
        if (r.ok) {
          try {
            const data = await r.json()
            if (data && (data.summary != null || data.done != null)) {
              setLastFeedback({ ...data, at: new Date().toLocaleTimeString('fr-FR') })
            }
          } catch {
            // ignore json parse
          }
        }
      } catch {
        setBridgeOk(false)
      }
    }
    check()
    const id = setInterval(check, 5000)
    return () => clearInterval(id)
  }, [])

  async function copyCmd(cmd: string, key: string) {
    try {
      await navigator.clipboard.writeText(cmd)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: S.bg0, padding: 24, fontFamily: 'Inter,sans-serif', maxWidth: 420, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: S.tx, margin: '0 0 20px' }}>Dev Loop</h1>

      <div style={{ background: S.bg1, borderRadius: 12, padding: 16, border: '1px solid ' + S.border, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: S.tx3, marginBottom: 6 }}>Statut bridge</div>
        <div style={{ fontSize: 18 }}>
          {bridgeOk === null ? '—' : bridgeOk ? '🟢 OK' : '🔴 KO'}
        </div>
      </div>

      <div style={{ background: S.bg1, borderRadius: 12, padding: 16, border: '1px solid ' + S.border, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: S.tx3, marginBottom: 6 }}>Dernier feedback reçu</div>
        <div style={{ fontSize: 13, color: S.tx2 }}>
          {lastFeedback ? (
            <>
              {lastFeedback.summary ?? (lastFeedback.done ? 'done' : '—')}
              {lastFeedback.at && <span style={{ color: S.tx3, marginLeft: 8 }}>{lastFeedback.at}</span>}
            </>
          ) : (
            '—'
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {COMMANDS.map(({ label, cmd }) => (
          <button
            key={label}
            onClick={() => copyCmd(cmd, label)}
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              border: '1px solid ' + S.border,
              background: copied === label ? S.green + '22' : S.bg1,
              color: S.tx,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {label}
            <span style={{ fontSize: 12, color: S.tx3 }}>{copied === label ? 'Copié' : 'Copier'}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => copyCmd(RELANCER_CMD, 'relancer')}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 10,
            border: '1px solid ' + S.border,
            background: copied === 'relancer' ? S.green + '22' : S.bg1,
            color: S.tx,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          Tout relancer
          <span style={{ fontSize: 12, color: S.tx3 }}>{copied === 'relancer' ? 'Copié' : 'Copier'}</span>
        </button>
      </div>
    </div>
  )
}
