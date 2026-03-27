import { SkeletonChatPage } from '../components/Skeleton'
import { ArrowLeft, Send, Users, Shield, Camera, Smile, X } from 'lucide-react'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { formatMessageTime } from '../lib/timing'
import { SYSTEM_SENDER } from '../lib/constants'
import { showToast } from '../components/Toast'
import EmojiBar from '../components/EmojiBar'
import ChatMessageMenu from '../components/ChatMessageMenu'
import { useGroupChatData } from '../hooks/useGroupChatData'
import { useAuth } from '../contexts/AuthContext'
import GhostBlockedModal from '../components/GhostBlockedModal'

const S = colors

export default function GroupChatPage() {
  const {
    id, navigate, t,
    messages, newMessage, setNewMessage,
    showEmojiBar, setShowEmojiBar,
    replyTo, setReplyTo,
    menuMsg, setMenuMsg,
    loading, sending, uploading, recording,
    currentUser, session, members, myAcceptedAt,
    isHost, showMembers, setShowMembers, canChat,
    messagesEndRef, inputRef,
    sendPhoto, startRecording, stopRecording,
    sendMessage, toggleGroupChat, handleDeleteMessage,
  } = useGroupChatData()
  const { isGhost } = useAuth()

  if (loading) return <SkeletonChatPage />

  if (isGhost) {
    return (
      <div style={{ minHeight: '100vh', background: S.bg, position: 'relative' as const }}>
        <OrbLayer />
        <GhostBlockedModal open={true} onClose={() => navigate('/session/' + id)} />
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ minHeight:'100vh', background:S.bg, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
        <p style={{ color:S.tx3, fontSize:14 }}>{t('session.not_found')}</p>
        <button onClick={() => navigate(-1)} style={{ padding:'10px 20px', borderRadius:12, background:S.grad, color:'#fff', border:'none', fontWeight:600, cursor:'pointer' }}>{t('common.back')}</button>
      </div>
    )
  }

  if (!session.group_chat_enabled && !isHost) {
    return (
      <div style={{ minHeight:'100vh', background:S.bg, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, padding:24 }}>
        <Shield size={32} style={{ color:S.tx3 }} />
        <p style={{ color:S.tx, fontSize:16, fontWeight:600, textAlign:'center' }}>{t('chat.group_not_enabled')}</p>
        <p style={{ color:S.tx3, fontSize:13, textAlign:'center' }}>{t('chat.host_must_enable')}</p>
        <button onClick={() => navigate('/session/' + id)} style={{ padding:'10px 20px', borderRadius:12, background:S.grad, color:'#fff', border:'none', fontWeight:600, cursor:'pointer' }}>{t('common.back_to_session')}</button>
      </div>
    )
  }

  return (
    <div style={{
      display:'flex', flexDirection:'column', minHeight:'100vh',
      background:S.bg, maxWidth:480, margin:'0 auto', position:'relative' as const,
    }}>
      <OrbLayer />
      {/* Header */}
      <div style={{
        padding:'12px 16px', display:'flex', alignItems:'center', gap:12,
        borderBottom:'1px solid '+S.rule, background:'rgba(13,12,22,0.92)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
        paddingTop:'calc(12px + env(safe-area-inset-top, 0px))',
      }}>
        <button onClick={() => navigate('/session/' + id + '?tab=chat')} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
          <ArrowLeft size={18} strokeWidth={1.5} style={{ color:S.tx2 }} />
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:0, fontSize:15, fontWeight:700, color:S.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {session.title}
          </p>
          <p style={{ margin:0, fontSize:11, color:S.tx3 }}>
            {t('session.members')} ({members.length + (isHost ? 1 : 0)})
          </p>
        </div>
        <button onClick={() => setShowMembers(!showMembers)} style={{
          background:'none', border:'1px solid '+S.rule, borderRadius:10, padding:'6px 10px',
          cursor:'pointer', display:'flex', alignItems:'center', gap:4,
        }}>
          <Users size={14} style={{ color:S.tx3 }} />
          <span style={{ fontSize:11, color:S.tx3 }}>{members.length + (isHost ? 1 : 0)}</span>
        </button>
        {isHost && (
          <button onClick={toggleGroupChat} style={{
            padding:'6px 10px', borderRadius:10, fontSize:11, fontWeight:600, cursor:'pointer',
            background: session.group_chat_enabled ? S.sagebg : S.p2,
            color: session.group_chat_enabled ? S.sage : S.p,
            border:'1px solid ' + (session.group_chat_enabled ? S.sagebd : S.pbd),
          }}>
            {session.group_chat_enabled ? 'ON' : 'OFF'}
          </button>
        )}
      </div>

      {/* Members panel */}
      {showMembers && (
        <div style={{ padding:'12px 16px', background:'rgba(13,12,22,0.92)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderBottom:'1px solid '+S.rule }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {/* Host */}
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', background:S.bg2, borderRadius:99 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:S.p }} />
              <span style={{ fontSize:12, color:S.tx2 }}>Host</span>
            </div>
            {members.map(m => (
              <button key={m.applicant_id} onClick={() => navigate('/profile/' + m.applicant_id)} style={{
                display:'flex', alignItems:'center', gap:6, padding:'4px 10px',
                background:S.bg2, borderRadius:99, border:'none', cursor:'pointer',
              }}>
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt="" loading="lazy" style={{ width:18, height:18, borderRadius:'50%', objectFit:'cover' }} />
                ) : (
                  <div style={{ width:18, height:18, borderRadius:'50%', background:S.grad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#fff' }}>
                    {m.display_name[0]?.toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize:12, color:S.tx2 }}>{m.display_name}</span>
                {m.status === 'checked_in' || (m.status === 'accepted' && (m as any).checked_in) && <div style={{ width:6, height:6, borderRadius:'50%', background:S.sage }} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Not enabled banner for host */}
      {isHost && !session.group_chat_enabled && (
        <div style={{ padding:'10px 16px', background:S.p3, borderBottom:'1px solid '+S.pbd }}>
          <p style={{ margin:0, fontSize:12, color:S.p }}>
            {t('chat.group_disabled')}
          </p>
        </div>
      )}

      {/* No-history notice */}
      {myAcceptedAt && messages.length === 0 && (
        <div style={{ padding:16, textAlign:'center' }}>
          <p style={{ color:S.tx3, fontSize:13 }}>{t('chat.no_messages_yet')}</p>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:2 }}>
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUser?.id
          const isSystem = msg.sender_name === SYSTEM_SENDER || msg.sender_name?.startsWith('')
          const showName = !isMe && (i === 0 || messages[i-1]?.sender_id !== msg.sender_id)

          if (isSystem) {
            return (
              <div key={msg.id} style={{ padding:'8px 12px', margin:'8px 0', background:S.bg2, borderRadius:12, textAlign:'center' }}>
                <p style={{ margin:0, fontSize:12, color:S.tx3, lineHeight:1.4 }}>{msg.text}</p>
              </div>
            )
          }

          return (
            <div key={msg.id} onDoubleClick={() => setReplyTo({ id: msg.id, text: msg.text, sender_name: msg.sender_name || t('common.anonymous_fallback') })} style={{ display:'flex', flexDirection:'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginTop: showName ? 8 : 0 }}>
              {showName && (
                <button type="button" onClick={() => navigate('/profile/' + msg.sender_id)} style={{ margin:'0 0 2px 8px', fontSize:11, color:S.p, fontWeight:600, background:'none', border:'none', padding:0, cursor:'pointer', textDecoration:'underline', textDecorationColor:S.pbd }}>{msg.sender_name}</button>
              )}
              <div style={{
                maxWidth:'78%', padding: msg.has_media ? 4 : '8px 12px', borderRadius:18, lineHeight:1.45,
                background: isMe ? S.p2 : S.bg2,
                border: '1px solid ' + (isMe ? S.pbd : S.rule),
                borderBottomRightRadius: isMe ? 4 : 18,
                borderBottomLeftRadius: isMe ? 18 : 4,
                overflow:'hidden',
              }}
              onContextMenu={(e) => { e.preventDefault(); setMenuMsg(msg) }}
              >
                {msg.has_media && msg.media_urls?.map((url: string, mi: number) => {
                  const isAudio = url.endsWith('.webm') || url.includes('audio')
                  const isVideo = /\.(mp4|mov|avi|mkv)$/i.test(url) || url.includes('video')
                  if (isAudio) return <audio key={mi} controls src={url} style={{ width: '100%', maxWidth: 220, height: 36 }} />
                  if (isVideo) return <video key={mi} controls playsInline src={url} style={{ width: '100%', maxWidth: 240, borderRadius: 10, display: 'block' }} />
                  return <img key={mi} src={url} alt="" loading="lazy" style={{ width:'100%', maxWidth:240, borderRadius:12, display:'block' }} />
                })}
                {msg.text !== '\uD83D\uDCF7 Photo' && msg.text !== '\uD83C\uDFA4 Audio' && msg.text !== '\uD83C\uDFAC Vid\u00e9o' && <p style={{ margin:0, fontSize:14, color:S.tx, lineHeight:1.4, padding: msg.has_media ? '4px 8px 6px' : 0 }}>{msg.text}</p>}
                <p style={{ margin:'2px 0 0', fontSize:10, color:S.tx4, textAlign: isMe ? 'right' : 'left' }}>{formatMessageTime(msg.created_at)}{isMe && <span style={{ color: S.tx4, marginLeft: 3 }}>✓</span>}</p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply bar */}
      {replyTo && <div style={{padding:'8px 14px', background:'rgba(5,4,10,0.92)', borderTop:'1px solid '+S.rule, display:'flex', alignItems:'center', gap:8}}><div style={{flex:1,borderLeft:'3px solid '+S.p, padding:'4px 10px'}}><span style={{fontSize:10,color:S.p,fontWeight:700}}>{replyTo.sender_name}</span><p style={{fontSize:12,color:S.tx2,margin:'2px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{replyTo.text}</p></div><button onClick={() => setReplyTo(null)} style={{background:'none',border:'none',color:S.tx3,cursor:'pointer'}}><X size={14}/></button></div>}
      {/* Emoji bar */}
      {canChat && showEmojiBar && (
        <div style={{ padding: '6px 14px 0', background: 'rgba(5,4,10,0.92)' }}>
          <EmojiBar onSelect={e => { setNewMessage(prev => prev + e); setShowEmojiBar(false) }} />
        </div>
      )}
      {/* Ended session banner */}
      {session.status === 'ended' && (
        <div style={{ padding: '14px 16px', background: 'rgba(5,4,10,0.92)', borderTop: '1px solid '+S.rule, textAlign: 'center', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 13, color: S.tx3 }}>{t('session.session_ended_title')}</p>
        </div>
      )}
      {/* Input */}
      {session.status !== 'ended' && canChat && (session.group_chat_enabled || isHost) && (
        <div style={{
          padding:'10px 16px', borderTop: showEmojiBar ? 'none' : '1px solid '+S.rule, background:'rgba(5,4,10,0.92)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
          paddingBottom:'calc(10px + env(safe-area-inset-bottom, 0px))',
          display:'flex', gap:8, alignItems:'center',
        }}>
          <label style={{ display:'flex', alignItems:'center', justifyContent:'center', width:40, height:40, borderRadius:'50%', background:S.bg2, border:'1px solid '+S.rule, cursor: uploading?'not-allowed':'pointer', flexShrink:0, opacity: uploading?0.5:1 }}>
            <Camera size={16} style={{ color:S.tx3 }} />
            <input type="file" accept="image/*,video/*" onChange={e => { const f=e.target.files?.[0]; if(f) sendPhoto(f); e.target.value='' }} style={{ display:'none' }} disabled={uploading} />
          </label>
          <button type="button" onClick={recording ? stopRecording : startRecording} disabled={uploading} style={{ width:38, height:38, borderRadius:10, border:'none', background: recording ? S.red : S.bg2, color: recording ? '#fff' : S.tx3, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', animation: recording ? 'pulse 1s infinite' : 'none' }}>
            {recording ? '■' : '●'}
          </button>
          <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}'}</style>
          <button type="button" onClick={() => setShowEmojiBar(!showEmojiBar)} style={{ width:38, height:38, borderRadius:10, background: showEmojiBar ? S.p3 : S.bg2, border:'1px solid '+(showEmojiBar ? S.pbd : S.rule), display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
            <Smile size={16} style={{ color: showEmojiBar ? S.p : S.tx3 }} />
          </button>
          <input
            ref={inputRef}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder={t('placeholders.group_message')}
            style={{
              flex:1, padding:'10px 14px', borderRadius:99, border:'1px solid '+S.rule,
              background:S.bg2, color:S.tx, fontSize:14, outline:'none',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            style={{
              width:40, height:40, borderRadius:'50%', background:S.grad, border:'none',
              cursor: newMessage.trim() ? 'pointer' : 'default',
              opacity: newMessage.trim() ? 1 : 0.4,
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0,
            }}
          >
            <Send size={18} style={{ color:'#fff', marginLeft:2 }} />
          </button>
        </div>
      )}
      {menuMsg && <ChatMessageMenu message={menuMsg} isOwn={menuMsg.sender_id === currentUser?.id} onCopy={() => showToast(t('chat.copied'), 'success')} onReply={() => setReplyTo({ id: menuMsg.id, text: menuMsg.text, sender_name: menuMsg.sender_name })} onDelete={menuMsg.sender_id === currentUser?.id ? () => handleDeleteMessage(menuMsg.id) : undefined} onClose={() => setMenuMsg(null)} labels={{ copy: t('chat.copy_text'), reply: t('chat.reply'), delete: t('chat.delete_msg') }} />}
    </div>
  )
}
