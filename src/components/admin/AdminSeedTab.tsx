import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { colors, fonts } from '../../brand'
import { adminStyles } from '../../pages/AdminPage'
import { seedAll, clearAll } from '../../lib/seedTestData'
import { seedDemoData, clearDemoData } from '../../lib/seedDemoData'
import { Database, Trash2, AlertTriangle, Play, Users } from 'lucide-react'

const S = colors

export default function AdminSeedTab() {
  const { t } = useTranslation()
  const [seeding, setSeeding] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [seedingDemo, setSeedingDemo] = useState(false)
  const [clearingDemo, setClearingDemo] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const appendLog = (msg: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString('fr-FR')}] ${msg}`])
  }

  const handleSeed = async () => {
    if (seeding) return
    setSeeding(true)
    appendLog('Seed complet demarre...')
    try {
      const result = await seedAll()
      appendLog(`Session creee: ${result.sessionId}`)
      appendLog(`Code invite: ${result.inviteCode}`)
      appendLog('Seed termine avec succes.')
    } catch (err) {
      appendLog(`ERREUR: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSeeding(false)
    }
  }

  const handleReset = async () => {
    if (resetting) return
    if (!resetConfirm) {
      setResetConfirm(true)
      appendLog('Reset requested. Click again to confirm.')
      return
    }
    setResetting(true)
    setResetConfirm(false)
    appendLog('Reset DB demarre...')
    try {
      await clearAll()
      appendLog('Reset termine avec succes.')
    } catch (err) {
      appendLog(`ERREUR: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setResetting(false)
    }
  }

  const handleSeedDemo = async () => {
    if (seedingDemo) return
    setSeedingDemo(true)
    appendLog('Demo seed demarre (10 users, 5 sessions, contacts, intents, reviews...)')
    try {
      await seedDemoData((step) => appendLog(step))
      appendLog('Demo seed termine avec succes.')
    } catch (err) {
      appendLog(`ERREUR: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSeedingDemo(false)
    }
  }

  const handleClearDemo = async () => {
    if (clearingDemo) return
    setClearingDemo(true)
    appendLog('Nettoyage demo data...')
    try {
      await clearDemoData()
      appendLog('Demo data nettoyee avec succes.')
    } catch (err) {
      appendLog(`ERREUR: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setClearingDemo(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={adminStyles.sectionLabel(S.red)}>SEED & RESET</p>

      {/* Warning */}
      <div style={{
        ...adminStyles.card,
        border: '1px solid ' + S.redbd,
        background: S.redbg,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: 14,
      }}>
        <AlertTriangle size={18} strokeWidth={1.5} style={{ color: S.red, flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: S.red, fontFamily: fonts.hero, marginBottom: 4 }}>
            Attention
          </div>
          <div style={{ fontSize: 12, color: S.tx2, lineHeight: 1.5 }}>
            Ces actions modifient la base de donnees de production. Utilisez avec precaution.
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleSeed}
          disabled={seeding}
          style={{
            ...adminStyles.btnPrimary,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            opacity: seeding ? 0.6 : 1,
          }}
        >
          {seeding ? (
            <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: S.tx, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <Play size={14} strokeWidth={2} />
          )}
          Seed complet
        </button>

        <button
          onClick={handleReset}
          disabled={resetting}
          style={{
            ...adminStyles.btnDanger,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            opacity: resetting ? 0.6 : 1,
            border: resetConfirm ? '1px solid ' + S.red : '1px solid ' + S.redbd,
            background: resetConfirm ? S.red + '33' : S.redbg,
          }}
        >
          {resetting ? (
            <div style={{ width: 14, height: 14, border: '2px solid ' + S.red + '44', borderTopColor: S.red, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <Trash2 size={14} strokeWidth={2} />
          )}
          {resetConfirm ? 'Confirm reset' : 'Reset DB'}
        </button>
      </div>

      {/* Demo Seed buttons */}
      <p style={adminStyles.sectionLabel(S.sage)}>DEMO DATA (rich seed)</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleSeedDemo}
          disabled={seedingDemo}
          style={{
            ...adminStyles.btnPrimary,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            opacity: seedingDemo ? 0.6 : 1,
            background: '#4c1d95',
          }}
        >
          {seedingDemo ? (
            <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: S.tx, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <Users size={14} strokeWidth={2} />
          )}
          Seed Demo (10 users)
        </button>

        <button
          onClick={handleClearDemo}
          disabled={clearingDemo}
          style={{
            ...adminStyles.btnDanger,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            opacity: clearingDemo ? 0.6 : 1,
          }}
        >
          {clearingDemo ? (
            <div style={{ width: 14, height: 14, border: '2px solid ' + S.red + '44', borderTopColor: S.red, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <Trash2 size={14} strokeWidth={2} />
          )}
          Clear demo data
        </button>
      </div>

      {/* Log */}
      <div style={{
        ...adminStyles.card,
        padding: 0,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '8px 12px',
          borderBottom: '1px solid ' + S.rule,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <Database size={12} strokeWidth={1.5} style={{ color: S.tx3 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: S.tx2 }}>Journal</span>
          {log.length > 0 && (
            <button
              onClick={() => setLog([])}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: S.tx3,
                fontSize: 10,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Effacer
            </button>
          )}
        </div>
        <div style={{
          maxHeight: 220,
          overflowY: 'auto',
          padding: 12,
          fontFamily: 'monospace',
          fontSize: 11,
          lineHeight: 1.7,
          color: S.tx2,
        }}>
          {log.length === 0 ? (
            <span style={{ color: S.tx3 }}>{t('common.no_action')}</span>
          ) : (
            log.map((entry, i) => (
              <div key={i} style={{ color: entry.includes('ERREUR') ? S.red : entry.includes('succes') ? S.sage : S.tx2 }}>
                {entry}
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
