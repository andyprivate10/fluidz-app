import { useState, useEffect } from 'react'
import { X, Check, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { colors } from '../brand'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getSections } from './apply/applySections'
import type { Section } from './apply/applySections'
import { showToast } from './Toast'

const S = colors

const ADULT_SECTION_IDS = ['photos_adulte', 'body_part_photos', 'role', 'pratiques', 'limites', 'sante']

function directDmSessionId(uid1: string, uid2: string): string {
  const sorted = [uid1, uid2].sort()
  const combined = sorted.join('-')
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i)
    hash |= 0
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0')
  return `dddd0000-${hex.slice(0, 4)}-${hex.slice(4, 8)}-0000-${sorted[0].slice(0, 12)}`
}
const DEFAULT_ENABLED = ['photos_profil', 'basics']

interface InterestPopupProps {
  open: boolean
  onClose: () => void
  targetUserId: string
  targetName: string
  onSent: () => void
}

export default function InterestPopup({ open, onClose, targetUserId, targetName, onSent }: InterestPopupProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [enabled, setEnabled] = useState<string[]>(DEFAULT_ENABLED)
  const [profile, setProfile] = useState<any>(null)
  const [sending, setSending] = useState(false)

  const { ALL_SECTIONS } = getSections(t)

  // Load own profile on mount / open
  useEffect(() => {
    if (!open || !user) return
    setEnabled([...DEFAULT_ENABLED])
    supabase
      .from('user_profiles')
      .select('display_name, profile_json')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setProfile(data) })
  }, [open, user])

  if (!open) return null

  const pj = profile?.profile_json || {}

  function toggle(sectionId: string) {
    setEnabled(prev =>
      prev.includes(sectionId)
        ? prev.filter(x => x !== sectionId)
        : [...prev, sectionId]
    )
  }

  async function handleSend() {
    if (!user || sending) return

    // Validate adult sections require intimate + profile photos
    const hasAdult = enabled.some(id => ADULT_SECTION_IDS.includes(id))
    if (hasAdult) {
      const photosIntime = Array.isArray(pj.photos_intime) ? pj.photos_intime : []
      const photosProfil = Array.isArray(pj.photos_profil)
        ? pj.photos_profil
        : Array.isArray(pj.photos)
          ? pj.photos
          : pj.avatar_url ? [pj.avatar_url] : []
      if (photosIntime.length < 1 || photosProfil.length < 1) {
        showToast(t('interest.need_adult_photo'), 'error')
        return
      }
    }

    setSending(true)
    try {
      const { error } = await supabase.rpc('rpc_send_interest', {
        p_receiver_id: targetUserId,
        p_shared_sections: enabled,
        p_profile_snapshot: pj,
      })
      if (error) {
        showToast(error.message, 'error')
        return
      }
      // Create DM session + system message with shared sections
      const sid = directDmSessionId(user.id, targetUserId)
      await supabase.from('sessions').upsert({
        id: sid, host_id: user.id, title: 'DM', status: 'active',
      }, { onConflict: 'id' })
      await supabase.from('messages').insert({
        session_id: sid,
        sender_id: user.id,
        text: '[INTEREST_SHARED]' + JSON.stringify(enabled),
        sender_name: profile?.display_name || '',
        room_type: 'dm',
        dm_peer_id: targetUserId,
        locked: true,
      })
      showToast(t('interest.sent_toast'), 'success')
      onSent()
      onClose()
    } catch {
      showToast(t('interest.send_error'), 'error')
    } finally {
      setSending(false)
    }
  }

  function renderSection(sec: Section) {
    const on = enabled.includes(sec.id)
    return (
      <div key={sec.id} onClick={() => toggle(sec.id)} style={{
        background: on ? S.p3 : S.bg2,
        border: '1px solid ' + (on ? S.pbd : S.rule),
        borderRadius: 14, padding: '12px 14px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <sec.icon size={18} style={{ color: on ? S.p : S.tx4, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: on ? S.tx : S.tx3 }}>{sec.label}</p>
            <p style={{ margin: 0, fontSize: 11, color: S.tx4 }}>{sec.desc}</p>
          </div>
        </div>
        <div style={{
          width: 20, height: 20, borderRadius: 99,
          background: on ? S.grad : 'transparent',
          border: on ? 'none' : '2px solid ' + S.rule,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {on && <Check size={11} strokeWidth={3} style={{ color: S.tx }} />}
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 999,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          maxHeight: '85vh',
          background: S.bg1,
          borderRadius: '24px 24px 0 0',
          padding: 20,
          overflowY: 'auto',
          animation: 'slideUp 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: S.tx, margin: '0 0 4px' }}>
              {t('interest.popup_title')}
            </h2>
            <p style={{ fontSize: 13, color: S.tx3, margin: 0 }}>
              {t('interest.popup_subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: S.tx3,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Section toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {ALL_SECTIONS.map((sec: Section) => renderSection(sec))}
        </div>

        {/* Summary */}
        <div style={{
          padding: '10px 14px', background: 'rgba(22,20,31,0.85)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 12, border: '1px solid ' + S.rule2, marginBottom: 14,
        }}>
          <p style={{ fontSize: 12, color: S.tx3, margin: 0 }}>
            {t('apply.sections_shared', { count: enabled.length, total: ALL_SECTIONS.length })}
          </p>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || enabled.length === 0}
          style={{
            width: '100%', padding: 14, borderRadius: 14,
            fontWeight: 700, fontSize: 15, color: S.tx,
            background: `linear-gradient(135deg, ${S.p}, #c06868)`,
            border: 'none', cursor: (sending || enabled.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (sending || enabled.length === 0) ? 0.5 : 1,
            boxShadow: '0 4px 20px ' + S.pbd,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Send size={16} />
          {sending ? t('interest.sending') : t('interest.send')}
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
