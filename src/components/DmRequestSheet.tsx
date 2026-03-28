import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from './Toast'
import { X, Lock, Send } from 'lucide-react'
import { colors, fonts, glassCard } from '../brand'
import { useTranslation } from 'react-i18next'
import type { DmPrivacyLevel } from '../lib/dmPrivacy'

const S = colors

interface Props {
  open: boolean
  onClose: () => void
  targetUserId: string
  targetName: string
  targetAvatar?: string
  privacyLevel: DmPrivacyLevel
  onSent: () => void
}

export default function DmRequestSheet({ open, onClose, targetUserId, targetName, targetAvatar, privacyLevel, onSent }: Props) {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [savedMsgs, setSavedMsgs] = useState<{ id: string; text: string }[]>([])
  const [sending, setSending] = useState(false)
  const [myProfile, setMyProfile] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (!open) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('saved_messages').select('id, text').eq('user_id', user.id).order('sort_order').then(({ data }) => setSavedMsgs(data || []))
      supabase.from('user_profiles').select('display_name, profile_json').eq('id', user.id).maybeSingle().then(({ data }) => {
        if (data) setMyProfile({ display_name: data.display_name, ...(data.profile_json as Record<string, unknown> || {}) })
      })
    })
  }, [open])

  async function sendRequest() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || sending) return
    setSending(true)

    const sharedProfile = myProfile ? {
      display_name: myProfile.display_name,
      avatar_url: myProfile.avatar_url,
      role: myProfile.role,
      age: myProfile.age,
      bio: myProfile.bio,
    } : {}

    const sharedAlbums = privacyLevel === 'full_access' ? {
      public_photos: myProfile?.photos_profil || [],
      adult_photos: myProfile?.photos_intime || [],
    } : {}

    await supabase.from('dm_requests').upsert({
      sender_id: user.id,
      receiver_id: targetUserId,
      status: 'pending',
      shared_profile: sharedProfile,
      shared_albums: sharedAlbums,
      message: message.trim(),
    }, { onConflict: 'sender_id,receiver_id' })

    await supabase.from('notifications').insert({
      user_id: targetUserId,
      type: 'dm_request',
      title: (myProfile?.display_name as string) || t('common.someone'),
      body: t('dm_request.notification_body'),
      href: '/notifications',
    })

    showToast(t('dm_request.sent'), 'success')
    setSending(false)
    onSent()
    onClose()
  }

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, maxHeight: '80vh', background: S.bg1, borderRadius: '20px 20px 0 0', overflow: 'auto', padding: '20px 16px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: S.tx, margin: 0, fontFamily: fonts.hero }}>{t('dm_request.title')}</h2>
          <button aria-label="Close" onClick={onClose} style={{ background: 'none', border: 'none', color: S.tx3, cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Target info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          {targetAvatar ? (
            <img src={targetAvatar} alt="" style={{ width: 40, height: 40, borderRadius: '28%', objectFit: 'cover', border: '1px solid ' + S.rule }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: '28%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>{targetName[0]?.toUpperCase()}</div>
          )}
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: S.tx, margin: 0 }}>{targetName}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Lock size={11} style={{ color: S.tx3 }} />
              <span style={{ fontSize: 11, color: S.tx3 }}>
                {privacyLevel === 'profile_required' ? t('dm_request.profile_required_desc') : t('dm_request.full_access_desc')}
              </span>
            </div>
          </div>
        </div>

        {/* Profile preview */}
        {myProfile && (
          <div style={{ ...glassCard, padding: 14, marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>{t('dm_request.your_profile')}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {myProfile.avatar_url ? <img src={String(myProfile.avatar_url)} alt="" style={{ width: 36, height: 36, borderRadius: '28%', objectFit: 'cover' }} /> : null}
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: S.tx }}>{String(myProfile.display_name || '')}</span>
                {myProfile.role ? <span style={{ fontSize: 11, color: S.p, marginLeft: 6 }}>{String(myProfile.role)}</span> : null}
              </div>
            </div>
          </div>
        )}

        {/* Saved messages chips */}
        {savedMsgs.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: S.tx4, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>{t('dm_request.pick_template')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {savedMsgs.map(m => (
                <button key={m.id} onClick={() => setMessage(m.text)} style={{
                  padding: '5px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  border: '1px solid ' + (message === m.text ? S.pbd : S.rule),
                  background: message === m.text ? S.p2 : S.bg2,
                  color: message === m.text ? S.p : S.tx3,
                }}>
                  {m.text.slice(0, 40)}{m.text.length > 40 ? '...' : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message input */}
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={t('dm_request.write_message')}
          rows={3}
          style={{ width: '100%', padding: 12, borderRadius: 12, background: S.bg2, border: '1px solid ' + S.rule, color: S.tx, fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: fonts.body, marginBottom: 16 }}
        />

        <button onClick={sendRequest} disabled={sending} style={{
          width: '100%', padding: 14, borderRadius: 14, background: S.p, border: 'none', color: '#fff',
          fontSize: 15, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.6 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <Send size={16} /> {sending ? '...' : t('dm_request.send')}
        </button>
      </div>
    </div>
  )
}
