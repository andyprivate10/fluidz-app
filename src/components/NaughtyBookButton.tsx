import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Check, Clock, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../brand'
import { showToast } from './Toast'

const S = colors

type Status = 'none' | 'pending_sent' | 'pending_received' | 'mutual'

interface ContactsButtonProps {
  targetUserId: string
  isMutual: boolean
  onStatusChange?: (status: 'none' | 'pending' | 'mutual') => void
}

export default function ContactsButton({ targetUserId, isMutual, onStatusChange }: ContactsButtonProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [status, setStatus] = useState<Status>(isMutual ? 'mutual' : 'none')
  const [requestId, setRequestId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || isMutual) return
    let cancelled = false

    async function fetchStatus() {
      // Check where I'm the sender
      const { data: sent } = await supabase
        .from('contacts_section_requests')
        .select('id, status')
        .eq('sender_id', user!.id)
        .eq('receiver_id', targetUserId)
        .maybeSingle()

      if (cancelled) return

      if (sent) {
        if (sent.status === 'accepted') {
          setStatus('mutual')
          setRequestId(sent.id)
          onStatusChange?.('mutual')
        } else if (sent.status === 'pending') {
          setStatus('pending_sent')
          setRequestId(sent.id)
          onStatusChange?.('pending')
        }
        return
      }

      // Check where I'm the receiver
      const { data: received } = await supabase
        .from('contacts_section_requests')
        .select('id, status')
        .eq('sender_id', targetUserId)
        .eq('receiver_id', user!.id)
        .maybeSingle()

      if (cancelled) return

      if (received) {
        if (received.status === 'accepted') {
          setStatus('mutual')
          setRequestId(received.id)
          onStatusChange?.('mutual')
        } else if (received.status === 'pending') {
          setStatus('pending_received')
          setRequestId(received.id)
          onStatusChange?.('pending')
        }
        return
      }

      setStatus('none')
      onStatusChange?.('none')
    }

    fetchStatus()
    return () => { cancelled = true }
  }, [user, targetUserId, isMutual])

  async function handleSendRequest() {
    if (!user || loading) return
    setLoading(true)
    const { error } = await supabase.rpc('rpc_request_contacts_section', { p_receiver_id: targetUserId })
    setLoading(false)
    if (error) {
      if (error.message?.includes('Cooldown active')) {
        showToast(t('contacts_section.cooldown_toast'), 'error')
      } else {
        showToast(error.message, 'error')
      }
      return
    }
    setStatus('pending_sent')
    onStatusChange?.('pending')
    showToast(t('contacts_section.request_sent'), 'success')
  }

  async function handleAccept() {
    if (!requestId || loading) return
    setLoading(true)
    const { error } = await supabase.rpc('rpc_respond_contacts_section', { p_request_id: requestId, p_action: 'accepted' })
    setLoading(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    setStatus('mutual')
    onStatusChange?.('mutual')
    showToast(t('contacts_section.accepted_toast'), 'success')
  }

  async function handleReject() {
    if (!requestId || loading) return
    setLoading(true)
    const { error } = await supabase.rpc('rpc_respond_contacts_section', { p_request_id: requestId, p_action: 'rejected' })
    setLoading(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    setStatus('none')
    setRequestId(null)
    onStatusChange?.('none')
  }

  async function handleRemove() {
    if (!user || loading) return
    const confirmed = window.confirm(t('contacts_section.remove_confirm'))
    if (!confirmed) return
    setLoading(true)
    const { error } = await supabase.rpc('rpc_remove_contacts_section', { p_target_id: targetUserId })
    setLoading(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    setStatus('none')
    setRequestId(null)
    onStatusChange?.('none')
    showToast(t('contacts_section.removed_toast'), 'info')
  }

  const base: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: 12,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    border: 'none',
    transition: 'opacity 0.15s',
  }

  if (status === 'none') {
    return (
      <button
        style={{ ...base, background: S.lavbg, border: '1px solid ' + S.lavbd, color: S.lav }}
        onClick={handleSendRequest}
        disabled={loading}
      >
        <BookOpen size={14} />
        {t('contacts_section.request_button')}
      </button>
    )
  }

  if (status === 'pending_sent') {
    return (
      <button
        style={{ ...base, background: S.bg2, border: '1px solid ' + S.rule, color: S.tx3, opacity: 0.6, cursor: 'default' }}
        disabled
      >
        <Clock size={14} />
        {t('contacts_section.request_pending')}
      </button>
    )
  }

  if (status === 'pending_received') {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          style={{ ...base, background: S.sagebg, border: '1px solid ' + S.sagebd, color: S.sage }}
          onClick={handleAccept}
          disabled={loading}
        >
          <Check size={14} />
          {t('contacts_section.accept')}
        </button>
        <button
          style={{ ...base, background: 'transparent', border: '1px solid ' + S.rule, color: S.tx3 }}
          onClick={handleReject}
          disabled={loading}
        >
          <X size={14} />
          {t('contacts_section.reject')}
        </button>
      </div>
    )
  }

  // mutual
  return (
    <button
      style={{ ...base, background: S.redbg, border: '1px solid ' + S.redbd, color: S.red }}
      onClick={handleRemove}
      disabled={loading}
    >
      <BookOpen size={14} />
      {t('contacts_section.remove')}
    </button>
  )
}
