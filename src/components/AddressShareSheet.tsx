import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MapPin, X } from 'lucide-react'
import { colors, glassCard } from '../brand'
import { useTranslation } from 'react-i18next'

const S = colors

type SavedAddress = { label?: string; approx_area?: string; exact_address?: string }

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (addr: SavedAddress) => void
  userId: string
}

export default function AddressShareSheet({ open, onClose, onSelect, userId }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open || !userId) return
    setLoading(true)
    supabase.from('user_profiles').select('profile_json').eq('id', userId).maybeSingle()
      .then(({ data }) => {
        const pj = (data?.profile_json || {}) as Record<string, unknown>
        const addrs = Array.isArray(pj.saved_addresses) ? pj.saved_addresses as SavedAddress[] : []
        setAddresses(addrs)
        setLoading(false)
      })
  }, [open, userId])

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, maxHeight: '60vh', background: S.bg1, borderRadius: '20px 20px 0 0', overflow: 'auto', padding: '20px 16px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: S.tx, margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{t('address.share_title')}</h2>
          <button aria-label="Close" onClick={onClose} style={{ background: 'none', border: 'none', color: S.tx3, cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {loading && <p style={{ color: S.tx3, fontSize: 13, textAlign: 'center', padding: 20 }}>…</p>}

        {!loading && addresses.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 14, color: S.tx3, margin: '0 0 12px' }}>{t('address.no_saved')}</p>
            <button onClick={() => { onClose(); navigate('/addresses') }} style={{ padding: '10px 20px', borderRadius: 10, background: S.p, border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t('settings.addresses')}
            </button>
          </div>
        )}

        {addresses.map((addr, i) => (
          <button key={i} onClick={() => { onSelect(addr); onClose() }} style={{ ...glassCard, width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', marginBottom: 8, cursor: 'pointer', textAlign: 'left' }}>
            <MapPin size={16} style={{ color: S.sage, flexShrink: 0 }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {addr.label && <div style={{ fontSize: 13, fontWeight: 700, color: S.tx }}>{addr.label}</div>}
              {addr.approx_area && <div style={{ fontSize: 11, color: S.tx3 }}>{addr.approx_area}</div>}
              {addr.exact_address && <div style={{ fontSize: 11, color: S.tx3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{addr.exact_address}</div>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Encode an address as a special message string */
export function encodeAddressMessage(addr: { label?: string; exact_address?: string; approx_area?: string }): string {
  return '[ADDRESS]' + JSON.stringify({ label: addr.label || '', exact_address: addr.exact_address || '', approx_area: addr.approx_area || '' })
}

/** Check if a message text is an address message */
export function isAddressMessage(text: string): boolean {
  return text.startsWith('[ADDRESS]')
}

/** Parse address message data */
export function parseAddressMessage(text: string): { label: string; exact_address: string; approx_area: string } | null {
  if (!isAddressMessage(text)) return null
  try {
    return JSON.parse(text.slice(9))
  } catch { return null }
}
