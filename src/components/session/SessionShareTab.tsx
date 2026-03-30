import { useState } from 'react'
import { Copy, UserPlus, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { colors, fonts } from '../../brand'
import { useTranslation } from 'react-i18next'
import { showToast } from '../Toast'

const S = colors

type Props = {
  session: { id: string; title: string; approx_area: string; invite_code?: string | null }
}

export default function SessionShareTab({ session }: Props) {
  const { t } = useTranslation()
  const [messageCopied, setMessageCopied] = useState(false)
  const [directCopied, setDirectCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined' ? window.location.origin + '/join/' + session.invite_code : ''
  const directUrl = shareUrl + '?direct=1'
  const shareText = session.title + (session.approx_area ? ' – ' + session.approx_area : '') + '\n\n' + shareUrl

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Message preview + copy */}
      <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid ' + S.rule2, borderRadius: 16, padding: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{t('session.share_message')}</p>
        <p style={{ fontSize: 13, color: S.tx, whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: '0 0 12px' }}>{shareText}</p>
        <button onClick={() => {
          navigator.clipboard?.writeText(shareText)
          setMessageCopied(true)
          setTimeout(() => setMessageCopied(false), 2000)
        }} style={{
          width: '100%', padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          border: '1px solid ' + (messageCopied ? S.sage : S.pbd),
          background: messageCopied ? S.sagebg : S.p2,
          color: messageCopied ? S.sage : S.p,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {messageCopied ? <><Check size={14} strokeWidth={2.5} /> {t('session.copied')}</> : <><Copy size={14} strokeWidth={1.5} /> {t('session.share_link')}</>}
        </button>
      </div>

      {/* Direct invite */}
      <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid ' + S.rule2, borderRadius: 16, padding: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: S.lav, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>{t('session.direct_invite')}</p>
        <p style={{ fontSize: 12, color: S.tx3, margin: '0 0 12px' }}>{t('session.direct_invite_desc')}</p>
        <button onClick={() => {
          navigator.clipboard?.writeText(directUrl)
          setDirectCopied(true)
          setTimeout(() => setDirectCopied(false), 2000)
          showToast(t('session.direct_link_copied'), 'success')
        }} style={{
          width: '100%', padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          border: '1px solid ' + (directCopied ? S.sage : 'rgba(184,178,204,0.25)'),
          background: directCopied ? S.sagebg : 'transparent',
          color: directCopied ? S.sage : S.lav,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <UserPlus size={14} strokeWidth={1.5} /> {directCopied ? t('session.direct_link_copied') : t('session.direct_invite')}
        </button>
      </div>

      {/* QR Code */}
      <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid ' + S.rule2, borderRadius: 16, padding: 20, textAlign: 'center' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: S.lav, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>QR Code</p>
        <div style={{ background: S.white, borderRadius: 12, padding: 16, display: 'inline-block' }}>
          <QRCodeSVG value={shareUrl} size={160} level="M" fgColor="#0C0A14" bgColor={S.white} />
        </div>
        <p style={{ fontSize: 11, color: S.tx3, margin: '10px 0 0' }}>{t('session.qr_hint')}</p>
      </div>

      {/* Share buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => window.open('https://wa.me/?text=' + encodeURIComponent(shareText), '_blank')} style={{
          flex: 1, padding: '12px 8px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          border: '1px solid ' + S.rule2, background: 'rgba(22,20,31,0.85)', color: '#25D366',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontFamily: fonts.body,
        }}>
          WhatsApp
        </button>
        {typeof navigator !== 'undefined' && navigator.share && (
          <button onClick={() => navigator.share({ title: session.title, text: shareText, url: shareUrl }).catch(() => {})} style={{
            flex: 1, padding: '12px 8px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: '1px solid ' + S.rule2, background: 'rgba(22,20,31,0.85)', color: S.tx2,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: fonts.body,
          }}>
            {t('session.share_native')}
          </button>
        )}
      </div>
    </div>
  )
}
