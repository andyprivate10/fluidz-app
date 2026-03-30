import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { colors, fonts } from '../../brand'
import { adminStyles } from '../../pages/AdminPage'
import type { User } from '@supabase/supabase-js'
import { Zap, LogOut, UserCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const S = colors

const TEST_ACCOUNTS = [
  { email: 'marcus@fluidz.test', role: 'Host', name: 'Marcus' },
  { email: 'karim@fluidz.test', role: 'Member', name: 'Karim' },
  { email: 'yann@fluidz.test', role: 'Guest', name: 'Yann' },
]

interface Props {
  user: User | null
  setUser: (u: User | null) => void
}

export default function AdminAuthTab({ user, setUser }: Props) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  async function loginAs(email: string) {
    setLoading(email)
    setFeedback(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: 'testpass123' })
    setLoading(null)
    if (error) {
      setIsError(true)
      setFeedback(t('errors.error_prefix') + ': ' + error.message)
    } else if (data.user) {
      setUser(data.user)
      setIsError(false)
      setFeedback('Connecte: ' + email)
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setFeedback(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Current user badge */}
      {user && (
        <div style={{
          ...adminStyles.card,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: S.sage, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: S.tx, fontWeight: 600 }}>{user.email}</span>
          </div>
          <button onClick={logout} style={{
            ...adminStyles.btnSecondary,
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
          }}>
            <LogOut size={12} strokeWidth={1.5} />
            Logout
          </button>
        </div>
      )}

      {/* Feedback toast */}
      {feedback && (
        <div style={{
          ...adminStyles.card,
          borderColor: isError ? S.redbd : S.sagebd,
          background: isError ? S.redbg : S.sagebg,
          color: isError ? S.red : S.sage,
          fontSize: 12,
          fontWeight: 600,
          padding: 12,
        }}>
          {feedback}
        </div>
      )}

      {/* Section label */}
      <p style={adminStyles.sectionLabel(S.p)}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Zap size={10} strokeWidth={2} />
          AUTH EXPRESS
        </span>
      </p>

      {/* Test account buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TEST_ACCOUNTS.map(acct => {
          const isActive = user?.email === acct.email
          return (
            <button
              key={acct.email}
              onClick={() => loginAs(acct.email)}
              disabled={loading !== null}
              style={{
                ...adminStyles.card,
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textAlign: 'left',
                border: '1px solid ' + (isActive ? S.sagebd : S.rule),
                background: isActive ? S.sagebg : S.bg1,
                opacity: loading && loading !== acct.email ? 0.5 : 1,
                transition: 'opacity 0.15s, border-color 0.15s',
              }}
            >
              <UserCircle size={28} strokeWidth={1.2} style={{ color: isActive ? S.sage : S.tx3, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: S.tx, fontFamily: fonts.hero }}>
                  {acct.name}
                </div>
                <div style={{ fontSize: 11, color: S.tx2, marginTop: 2 }}>{acct.email}</div>
              </div>
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: isActive ? S.sage : S.tx3,
                background: isActive ? S.sagebg : S.bg2,
                border: '1px solid ' + (isActive ? S.sagebd : S.rule),
                borderRadius: 6,
                padding: '3px 8px',
              }}>
                {acct.role}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
