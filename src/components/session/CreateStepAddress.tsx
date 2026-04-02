import { Lock } from 'lucide-react'
import { colors } from '../../brand'
import { inp } from '../../hooks/useCreateSession'
import { supabase } from '../../lib/supabase'
import type { useCreateSession } from '../../hooks/useCreateSession'

const S = colors

type Props = { h: ReturnType<typeof useCreateSession> }

export default function CreateStepAddress({ h }: Props) {
  return (
    <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Warning banner */}
      <div style={{
        padding: '12px 14px', borderRadius: 12,
        background: S.orangebg, border: '1px solid ' + S.orangebd,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Lock size={16} style={{ color: S.orange, flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: S.orange, margin: 0, lineHeight: 1.4 }}>
          {h.t('session.address_warning')}
        </p>
      </div>

      {/* Saved addresses selector */}
      {h.savedAddresses.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
            {h.t('session.saved_addresses')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {h.savedAddresses.map((addr, i) => (
              <button
                key={addr.id || i}
                type="button"
                onClick={() => { h.pickSavedAddress(addr); h.switchAddressMode('list') }}
                style={{
                  padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                  border: '1px solid ' + S.rule, background: S.bg2, color: S.tx2, cursor: 'pointer',
                }}
              >
                {addr.label || addr.approx_area || h.t('session.address_label')}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => h.switchAddressMode('new')}
            style={{
              marginTop: 8, padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              border: '1px solid ' + S.pbd, background: 'transparent', color: S.p, cursor: 'pointer',
            }}
          >
            {h.t('session.new_address')}
          </button>
        </div>
      )}

      {/* Address fields */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{h.t('session.approx_area_label')}</p>
        <input value={h.approxArea} onChange={e => h.setApproxArea(e.target.value)} placeholder={h.t('session.approx_area_placeholder')} style={inp} />
        <p style={{ fontSize: 11, color: S.tx4, marginTop: 6 }}>{h.t('session.approx_area_note')}</p>
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{h.t('session.street_address')}</p>
        <input value={h.streetAddress} onChange={e => h.setStreetAddress(e.target.value)} placeholder={h.t('session.street_address_placeholder')} style={inp} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{h.t('session.postal_code')}</p>
          <input value={h.postalCode} onChange={e => h.setPostalCode(e.target.value)} placeholder="75011" style={inp} />
        </div>
        <div style={{ flex: 2 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{h.t('session.city')}</p>
          <input value={h.city} onChange={e => h.setCity(e.target.value)} placeholder="Paris" style={inp} />
        </div>
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{h.t('session.country')}</p>
        <input value={h.country} onChange={e => h.setCountry(e.target.value)} placeholder="France" style={inp} />
      </div>

      {/* Directions */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{h.t('session.directions_label')}</p>
        <p style={{ fontSize: 12, color: S.tx4, marginBottom: 8 }}>{h.t('session.directions_help')}</p>
        {h.directions.map((step, i) => (
          <div key={i} style={{ marginBottom: 8, padding: 10, background: S.bg, borderRadius: 10, border: '1px solid ' + S.rule }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: S.p }}>#{i + 1}</span>
              <input
                value={step.text}
                onChange={e => { const next = [...h.directions]; next[i] = { ...next[i], text: e.target.value }; h.setDirections(next) }}
                placeholder={h.t('session.direction_placeholder')}
                style={{ ...inp, flex: 1, fontSize: 13 }}
              />
              {h.directions.length > 1 && (
                <button type="button" onClick={() => h.setDirections(h.directions.filter((_, j) => j !== i))} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 11, border: '1px solid ' + S.redbd, background: 'transparent', color: S.red, cursor: 'pointer' }}>×</button>
              )}
            </div>
            {step.photo_url ? (
              <div style={{ marginTop: 6, position: 'relative', display: 'inline-block' }}>
                <img src={step.photo_url} alt="" loading="lazy" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid ' + S.rule }} />
                <button type="button" onClick={() => { const next = [...h.directions]; next[i] = { ...next[i], photo_url: undefined }; h.setDirections(next) }} style={{ position: 'absolute', top: -12, right: -12, width: 44, height: 44, borderRadius: '50%', background: 'transparent', border: 'none', color: S.tx, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ width: 16, height: 16, borderRadius: '50%', background: S.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</span></button>
              </div>
            ) : (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, padding: '4px 8px', borderRadius: 6, border: '1px solid ' + S.rule, background: S.bg2, color: S.tx4, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                {h.t('session.direction_photo')}
                <input type="file" accept="image/*" onChange={async (e) => {
                  const f = e.target.files?.[0]; if (!f) return
                  const { compressImage: ci } = await import('../../lib/media')
                  const c = await ci(f)
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) return
                  const path = user.id + '/dir_' + Date.now() + '.jpg'
                  const { error } = await supabase.storage.from('avatars').upload(path, c)
                  if (error) return
                  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
                  const next = [...h.directions]; next[i] = { ...next[i], photo_url: publicUrl }; h.setDirections(next)
                }} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        ))}
        <button type="button" onClick={() => h.setDirections([...h.directions, { text: '' }])} style={{ padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: '1px solid ' + S.rule, background: S.bg2, color: S.tx2, cursor: 'pointer' }}>
          {h.t('session.add_direction')}
        </button>
      </div>

      <button
        onClick={h.saveAddress}
        disabled={h.savingAddress || (!h.approxArea && !h.exactAddress)}
        style={{
          padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          border: '1px solid ' + S.p, background: 'transparent', color: S.p,
          cursor: h.savingAddress || (!h.approxArea && !h.exactAddress) ? 'not-allowed' : 'pointer',
          opacity: h.savingAddress || (!h.approxArea && !h.exactAddress) ? 0.6 : 1,
        }}
      >
        {h.savingAddress ? h.t('common.saving') : h.t('session.save_address')}
      </button>

      <button
        onClick={() => h.setStep('timing')}
        disabled={!h.approxArea}
        style={{
          padding: '14px', borderRadius: 14, fontWeight: 700, fontSize: 15, color: S.tx,
          background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden',
          cursor: !h.approxArea ? 'not-allowed' : 'pointer', opacity: !h.approxArea ? 0.5 : 1,
          boxShadow: '0 4px 20px ' + S.pbd, marginTop: 4,
        }}
      >
        {h.t('session.continue_button')}
      </button>
    </div>
  )
}
