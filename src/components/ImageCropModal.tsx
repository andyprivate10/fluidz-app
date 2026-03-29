import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { useTranslation } from 'react-i18next'
import { cropImage } from '../lib/media'
import { colors } from '../brand'

const S = colors

type Props = {
  imageSrc: string
  aspect?: number
  onConfirm: (croppedFile: File) => void
  onCancel: () => void
}

export default function ImageCropModal({ imageSrc, aspect = 1, onConfirm, onCancel }: Props) {
  const { t } = useTranslation()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((_: unknown, croppedPixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setProcessing(true)
    try {
      const file = await cropImage(imageSrc, croppedAreaPixels)
      onConfirm(file)
    } catch {
      onCancel()
    }
    setProcessing(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: '#000' },
            cropAreaStyle: { border: '2px solid ' + S.p },
          }}
        />
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', gap: 12, background: S.bg, borderTop: '1px solid ' + S.rule }}>
        <button
          onClick={onCancel}
          style={{ flex: 1, padding: 14, borderRadius: 14, border: '1px solid ' + S.rule, background: 'transparent', color: S.tx2, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={handleConfirm}
          disabled={processing}
          style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', background: S.p, color: S.tx, fontSize: 15, fontWeight: 700, cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.7 : 1 }}
        >
          {processing ? t('crop.processing') : t('crop.confirm')}
        </button>
      </div>
    </div>
  )
}
