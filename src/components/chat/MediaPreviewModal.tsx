import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { colors } from '../../brand'

const S = colors

interface Props {
  file: File | null
  onSend: (file: File) => void
  onCancel: () => void
}

export default function MediaPreviewModal({ file, onSend, onCancel }: Props) {
  const { t } = useTranslation()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  if (!file || !previewUrl) return null

  const isVideo = file.type.startsWith('video/')

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <p style={{ fontSize: 16, fontWeight: 700, color: S.tx, marginBottom: 16 }}>
        {t('chat.media_preview_title')}
      </p>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '60vh', overflow: 'hidden' }}>
        {isVideo ? (
          <video
            src={previewUrl}
            controls
            playsInline
            style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 16 }}
          />
        ) : (
          <img
            src={previewUrl}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 16, objectFit: 'contain' }}
          />
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24, width: '100%', maxWidth: 320 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: '14px 0', borderRadius: 14,
            background: S.bg2, border: '1px solid ' + S.rule,
            color: S.tx2, fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {t('chat.media_cancel')}
        </button>
        <button
          onClick={() => onSend(file)}
          style={{
            flex: 1, padding: '14px 0', borderRadius: 14,
            background: `linear-gradient(135deg, ${S.p}, ${S.pDark})`,
            border: 'none',
            color: S.tx, fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {t('chat.media_send')}
        </button>
      </div>
    </div>
  )
}
