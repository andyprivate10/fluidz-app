import { SkeletonChatPage } from '../components/Skeleton'
import { showToast } from '../components/Toast'
import { Camera, ArrowLeft, Copy, Map, MapPin, Smile, X, Plus, Shield } from 'lucide-react'
import { colors, fonts } from '../brand'
import OrbLayer from '../components/OrbLayer'
import ImageLightbox from '../components/ImageLightbox'
import EmojiBar from '../components/EmojiBar'
import ChatMessageMenu from '../components/ChatMessageMenu'
import AddressShareSheet from '../components/AddressShareSheet'
import DMMessageList from '../components/chat/DMMessageList'
import { useDMData } from '../hooks/useDMData'

const S = colors

export default function DMPage() {
  const d = useDMData()

  if (d.loading) return <SkeletonChatPage />

  return (
    <div style={{
      background: S.bg, height: '100vh', position: 'relative' as const, display: 'flex', flexDirection: 'column',
      padding: 0, maxWidth: 480, margin: '0 auto',
    }}>
      <OrbLayer />
      {/* Header */}
      <header style={{ padding: '16px 24px', borderBottom: '1px solid '+S.rule, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => d.navigate('/session/'+d.id+'?tab=chat')} style={{ background:'none', border:'none', color: S.tx3, fontSize: 16, cursor:'pointer', padding: 0 }}><ArrowLeft size={18} strokeWidth={1.5} /></button>
          {d.peerAvatar ? (
            <img src={d.peerAvatar} alt="" style={{ width: 32, height: 32, borderRadius: '28%', objectFit: 'cover', border: '1px solid '+S.rule, flexShrink: 0 }} />
          ) : d.peerName ? (
            <div style={{ width: 32, height: 32, borderRadius: '28%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{d.peerName[0].toUpperCase()}</div>
          ) : null}
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: S.tx, margin: 0 }}>
              {d.peerName || (d.session?.title ?? d.t('dm.title'))}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {d.peerRole && <span style={{ fontSize: 11, color: S.p, fontWeight: 600 }}>{d.peerRole}</span>}
              {d.peerRole && <span style={{ fontSize: 11, color: S.tx4 }}>·</span>}
              <span style={{ fontSize: 11, color: S.tx3 }}>{d.session?.title ?? ''}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
          <button onClick={() => d.setShowActions(v => !v)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid '+S.rule, background: 'transparent', color: S.tx2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={16} strokeWidth={2} />
          </button>
          {d.peerId && (
            <button onClick={() => d.navigate(d.isHost ? '/session/' + d.id + '/candidate/' + d.peerId : '/profile/' + d.peerId)} style={{ padding: '8px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: S.tx2, border: '1px solid '+S.rule, background: 'transparent', cursor: 'pointer' }}>
              {d.t('profile.see_profile')}
            </button>
          )}
          {d.showActions && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: S.bg1, border: '1px solid '+S.rule, borderRadius: 12, overflow: 'hidden', zIndex: 60, minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
              <button onClick={() => { d.setShowActions(false); d.navigate('/session/create?invite=' + d.peerId) }} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid '+S.rule, color: S.tx, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                {d.t('dm.create_session')}
              </button>
              <button onClick={() => { d.setShowActions(false); d.setShowAddressSheet(true) }} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: S.tx, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                {d.t('dm.share_address')}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Status banner */}
      {!d.isHost && d.appStatus === 'pending' && (
        <div style={{ margin: '12px 16px 0', padding: 14, background: S.orangebg, border: '1px solid '+S.orangebd, borderRadius: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: S.orange, fontWeight: 600, textAlign: 'center' }}>
            {d.t('dm.application_pending')}
          </div>
        </div>
      )}

      {d.showCheckInBanner && !d.showCheckInConfirmed && (
        <div style={{ margin: '12px 16px 0', padding: 14, background: S.sagebg, border: '1px solid '+S.sage, borderRadius: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: S.sage, fontWeight: 600, textAlign: 'center', marginBottom: 10 }}>
            {d.t('dm.checkin_banner')}
          </div>
          <button onClick={d.handleCheckIn} style={{ width: '100%', padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 700, color: 'white', background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden', cursor: 'pointer' }}>
            {d.t('dm.checkin_button')}
          </button>
        </div>
      )}

      {d.showCheckInConfirmed && (
        <div style={{ margin: '12px 16px 0', padding: 14, background: S.p2, border: '1px solid '+S.amberbd, borderRadius: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: S.p, fontWeight: 600, textAlign: 'center' }}>{d.t('session.checkin_sent_waiting')}</div>
        </div>
      )}

      {!d.isHost && d.appStatus === 'rejected' && (
        <div style={{ margin: '12px 16px 0', padding: 14, background: S.redbg, border: '1px solid '+S.redbd, borderRadius: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: S.red, fontWeight: 600, textAlign: 'center' }}>
            {d.t('dm.application_rejected')}
          </div>
        </div>
      )}

      {/* Address revealed */}
      {d.isAccepted && d.session?.exact_address && (
        <div style={{ margin: '12px 16px 0', padding: 14, background: S.sagebg, border: '1px solid '+S.sage, borderRadius: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: S.sage, marginBottom: 4 }}>
            {d.t('dm.address_revealed')}
          </div>
          <div style={{ fontSize: 14, color: S.tx, fontWeight: 600 }}>
            {d.session.exact_address}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button onClick={() => { navigator.clipboard.writeText(d.session!.exact_address || ''); showToast(d.t('common.copied'), 'success') }} style={{ flex: 1, padding: '6px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: S.sage, border: '1px solid ' + S.sagebd, background: 'transparent', cursor: 'pointer' }}>
              <Copy size={11} strokeWidth={1.5} style={{marginRight:2}} />{d.t('common.copy_label')}
            </button>
            <button onClick={() => { window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(d.session!.exact_address || ''), '_blank') }} style={{ flex: 1, padding: '6px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: S.blue, border: '1px solid '+S.bluebd, background: 'transparent', cursor: 'pointer' }}>
              <Map size={11} strokeWidth={1.5} style={{marginRight:2}} /> {d.t('common.maps')}
            </button>
          </div>
          {d.session.lineup_json?.directions && d.session.lineup_json.directions.length > 0 && (
            <div style={{ padding: '8px 16px 0' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: S.tx2, margin: '0 0 4px' }}>{d.t('dm.access_directions')}</p>
              {d.session.lineup_json.directions.map((step: any, i: number) => {
                const text = typeof step === 'string' ? step : step.text
                const photo = typeof step === 'string' ? undefined : step.photo_url
                return (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <p style={{ fontSize: 12, color: S.tx2, margin: 0, lineHeight: 1.4 }}>{i + 1}. {text}</p>
                    {photo && <img src={photo} alt="" loading="lazy" style={{ width: '100%', maxWidth: 180, height: 100, objectFit: 'cover', borderRadius: 8, marginTop: 4, border: '1px solid '+S.rule }} />}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Safety tip card for accepted members */}
      {d.isAccepted && !d.isHost && (
        <div style={{ margin: '12px 16px 0', padding: 14, background: S.bluebg, border: '1px solid ' + S.bluebd, borderRadius: 12, flexShrink: 0, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Shield size={18} strokeWidth={1.5} style={{ color: S.blue, flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: S.blue, marginBottom: 3 }}>{d.t('dm.safety_tip_title')}</div>
            <div style={{ fontSize: 12, color: S.blue, lineHeight: 1.5, opacity: 0.85 }}>{d.t('dm.safety_tip_body')}</div>
          </div>
        </div>
      )}

      <DMMessageList
        messages={d.messages}
        currentUser={d.currentUser}
        loading={d.loading}
        loadError={d.loadError}
        messagesEndRef={d.messagesEndRef}
        setReplyTo={d.setReplyTo}
        setMenuMsg={d.setMenuMsg}
        setChatLightbox={d.setChatLightbox}
        typingUsers={d.typingUsers}
      />

      {d.session?.status === 'ended' ? (
        <div style={{ padding: '14px 16px', background: 'rgba(5,4,10,0.92)', borderTop: '1px solid '+S.rule, textAlign: 'center', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 13, color: S.tx3 }}>{d.t('session.session_ended_title')}</p>
        </div>
      ) : (
        <>
          {/* Reply quote bar */}
          {d.replyTo && <div style={{padding:'8px 14px', background:'rgba(5,4,10,0.92)', borderTop:'1px solid '+S.rule, display:'flex', alignItems:'center', gap:8}}><div style={{flex:1,borderLeft:'3px solid '+S.p, padding:'4px 10px'}}><span style={{fontSize:10,color:S.p,fontWeight:700}}>{d.replyTo.sender_name}</span><p style={{fontSize:12,color:S.tx2,margin:'2px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.replyTo.text}</p></div><button onClick={() => d.setReplyTo(null)} style={{background:'none',border:'none',color:S.tx3,cursor:'pointer'}}><X size={14}/></button></div>}
          {/* Emoji bar */}
          {d.showEmojiBar && (
            <div style={{ padding: '6px 14px 0', background: 'rgba(5,4,10,0.92)' }}>
              <EmojiBar onSelect={e => { d.setNewMessage(prev => prev + e); d.setShowEmojiBar(false) }} />
            </div>
          )}
          <div style={{
            background: 'rgba(5,4,10,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', padding: 14, borderTop: d.showEmojiBar ? 'none' : '1px solid '+S.rule,
            display: 'flex', gap: 8, flexShrink: 0,
          }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, background: S.bg2, border: '1px solid '+S.rule, cursor: d.uploading ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: d.uploading ? 0.5 : 1 }}>
              <Camera size={18} style={{ color: S.tx3 }} />
              <input type="file" accept="image/*,video/*" onChange={e => { const f = e.target.files?.[0]; if (f) d.handleSendPhoto(f); e.target.value = '' }} style={{ display: 'none' }} disabled={d.uploading} />
            </label>
            <button type="button" onClick={d.recording ? d.stopRecording : d.startRecording} disabled={d.uploading} style={{ padding: '10px 12px', borderRadius: 12, border: 'none', background: d.recording ? S.red : S.bg2, color: d.recording ? '#fff' : S.tx3, cursor: 'pointer', fontSize: 16, animation: d.recording ? 'pulse 1s infinite' : 'none' }}>
              {d.recording ? '\u25A0' : '\u25CF'}
            </button>
            <button type="button" onClick={d.shareLocation} style={{ padding: '10px', borderRadius: 12, background: d.sharingLocation ? S.sagebg : S.bg2, color: d.sharingLocation ? S.sage : S.tx3, cursor: 'pointer', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, border: d.sharingLocation ? '1px solid '+S.sagebd : '1px solid ' + S.rule }}>
              {d.sharingLocation ? <MapPin size={16} strokeWidth={1.5} /> : <MapPin size={16} strokeWidth={1.5} />}
            </button>
            <button type="button" onClick={() => d.setShowEmojiBar(!d.showEmojiBar)} style={{ width: 44, height: 44, borderRadius: 12, background: d.showEmojiBar ? S.p3 : S.bg2, border: '1px solid ' + (d.showEmojiBar ? S.pbd : S.rule), display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <Smile size={18} style={{ color: d.showEmojiBar ? S.p : S.tx3 }} />
            </button>
            <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}'}</style>
            <input
              type="text"
              value={d.newMessage}
              onChange={(e) => { d.setNewMessage(e.target.value); d.sendTyping() }}
              onKeyDown={(e) => { if (e.key === 'Enter') { d.stopTyping(); d.handleSend() } }}
              placeholder={d.uploading ? d.t('chat.sending_photo') : d.t('chat.send')}
              style={{
                flex: 1, padding: 12, background: S.bg2, border: '1px solid '+S.rule,
                borderRadius: 12, color: S.tx, fontSize: 15, outline: 'none',
                fontFamily: fonts.body,
              }}
            />
            <button
              type="button"
              onClick={d.handleSend}
              style={{
                padding: '12px 16px', background: S.grad, color: 'white',
                border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer',
                fontSize: 16,
              }}
            >
              &rarr;
            </button>
          </div>
        </>
      )}
      {d.chatLightbox && <ImageLightbox images={[d.chatLightbox]} onClose={() => d.setChatLightbox(null)} />}
      {d.menuMsg && <ChatMessageMenu message={d.menuMsg} isOwn={d.menuMsg.sender_id === d.currentUser?.id} onCopy={() => showToast(d.t('chat.copied'), 'success')} onReply={() => d.setReplyTo({ id: d.menuMsg!.id, text: d.menuMsg!.text, sender_name: d.menuMsg!.sender_name })} onDelete={d.menuMsg.sender_id === d.currentUser?.id ? () => { d.handleDeleteMessage(d.menuMsg!.id) } : undefined} onClose={() => d.setMenuMsg(null)} labels={{ copy: d.t('chat.copy_text'), reply: d.t('chat.reply'), delete: d.t('chat.delete_msg') }} />}
      {d.currentUser && (
        <AddressShareSheet
          open={d.showAddressSheet}
          onClose={() => d.setShowAddressSheet(false)}
          userId={d.currentUser.id}
          onSelect={async (addr) => { d.handleAddressShare(addr) }}
        />
      )}
    </div>
  )
}
