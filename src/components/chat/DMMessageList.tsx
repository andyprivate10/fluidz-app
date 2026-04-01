import React from 'react'
import { SkeletonLine } from '../Skeleton'
import { MapPin } from 'lucide-react'
import { colors } from '../../brand'
import { formatMessageTime } from '../../lib/timing'
import { isAddressMessage, parseAddressMessage } from '../AddressShareSheet'
import { useTranslation } from 'react-i18next'
// TODO: Wire reactions into message bubbles
// import { useReactions } from '../../hooks/useReactions'
// import EmojiReactionPicker from './EmojiReactionPicker'
// import ReactionDisplay from './ReactionDisplay'
import type { Message } from '../../hooks/useDMData'
import type { RefObject } from 'react'

const S = colors

/* ── Memoized message bubble ── */
type MessageBubbleProps = {
  message: Message
  isMine: boolean
  isSeen: boolean
  onDoubleClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onLightbox: (url: string) => void
}

const MessageBubble = React.memo(function MessageBubble({ message, isMine, isSeen, onDoubleClick, onContextMenu, onLightbox }: MessageBubbleProps) {
  const { t } = useTranslation()
  return (
    <div onDoubleClick={onDoubleClick} style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isMine ? 'flex-end' : 'flex-start',
      padding: '0 24px',
    }}>
      {!isMine && (
        <span style={{ color: S.tx3, fontSize: 11, marginBottom: 2 }}>
          {message.sender_name}
        </span>
      )}
      <div style={{
        padding: message.has_media ? 4 : '10px 14px', fontSize: 14, maxWidth: '78%', lineHeight: 1.45,
        background: isMine ? 'linear-gradient(135deg, '+S.p+', '+S.pDark+')' : S.bg2,
        color: isMine ? 'white' : S.tx,
        borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        border: isMine ? 'none' : '1px solid ' + S.rule,
        boxShadow: isMine ? '0 2px 8px rgba(224,136,122,0.2)' : 'none',
        overflow: 'hidden',
      }}
      onContextMenu={onContextMenu}
      >
        {message.has_media && message.media_urls?.map((url: string, mi: number) => {
          const isAudio = url.endsWith('.webm') || url.includes('audio')
          const isVideo = /\.(mp4|mov|avi|mkv)$/i.test(url) || url.includes('video')
          if (isAudio) return <audio key={mi} controls src={url} style={{ width: '100%', maxWidth: 240, height: 36 }} />
          if (isVideo) return <video key={mi} controls playsInline src={url} style={{ width: '100%', maxWidth: 260, borderRadius: 12, display: 'block' }} />
          return <img key={mi} src={url} alt="" loading="lazy" onClick={() => onLightbox(url)} style={{ width: '100%', maxWidth: 240, borderRadius: 12, display: 'block', cursor: 'zoom-in' }} />
        })}
        {message.text && message.text !== '\u{1F4F7} Photo' && message.text !== '\u{1F3A4} Audio' && message.text !== '\u{1F3AC} Vid\u00e9o' && (
          message.text.startsWith('[INTENT_MATCH]') ? (() => {
            try {
              const data = JSON.parse(message.text.slice(14))
              return (
                <div style={{ padding: '8px 10px', background: 'rgba(74,222,128,0.08)', borderRadius: 10, border: '1px solid ' + S.sagebd }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: S.sage, marginBottom: 4 }}>{t('intents.match_title')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(data.intents || []).map((slug: string) => (
                      <span key={slug} style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, color: S.sage, background: S.sagebg, border: '1px solid ' + S.sagebd }}>{t('intents.' + slug)}</span>
                    ))}
                  </div>
                </div>
              )
            } catch { return <span>{message.text}</span> }
          })() :
          isAddressMessage(message.text) ? (() => {
            const addr = parseAddressMessage(message.text)
            if (!addr) return <span>{message.text}</span>
            return (
              <div style={{ padding: '8px 10px', background: S.sagebg, borderRadius: 10, border: '1px solid '+S.sagebd }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <MapPin size={14} style={{ color: S.sage }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: S.tx }}>{addr.label || t('address.shared_label')}</span>
                </div>
                {addr.exact_address && <p style={{ fontSize: 12, color: S.tx2, margin: '0 0 6px' }}>{addr.exact_address}</p>}
                <a href={'https://maps.google.com/?q=' + encodeURIComponent(addr.exact_address || addr.approx_area)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: S.sage, textDecoration: 'none' }}>
                  {t('address.open_maps')}
                </a>
              </div>
            )
          })() :
          message.text.includes('google.com/maps') ? (
            <a href={message.text.split('\n').find((l: string) => l.includes('google.com/maps')) || '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '6px 10px', background: S.sagebg, borderRadius: 8, color: S.sage, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              {message.text.split('\n')[0]}
            </a>
          ) : <span>{message.text}</span>
        )}
      </div>
      <span style={{ color: S.tx3, fontSize: 10, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
        {formatMessageTime(message.created_at)}
        {isMine && (
          <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 2, color: isSeen ? S.blue : S.tx4 }}>
            {isSeen ? '\u2713\u2713' : '\u2713'}
          </span>
        )}
      </span>
    </div>
  )
})

type DMMessageListProps = {
  messages: Message[]
  currentUser: { id: string } | null
  loading: boolean
  loadError: boolean
  messagesEndRef: RefObject<HTMLDivElement | null>
  setReplyTo: (r: { id: string; text: string; sender_name: string } | null) => void
  setMenuMsg: (m: Message | null) => void
  setChatLightbox: (url: string | null) => void
  typingUsers: string[]
}

export default function DMMessageList({
  messages,
  currentUser,
  loading,
  loadError,
  messagesEndRef,
  setReplyTo,
  setMenuMsg,
  setChatLightbox,
  typingUsers,
}: DMMessageListProps) {
  const { t } = useTranslation()

  return (
    <>
      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 0' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 24px', width: '100%', paddingTop: 20 }}>
            <div style={{ alignSelf: 'flex-start' }}><SkeletonLine width={200} height={44} style={{ borderRadius: 16 }} /></div>
            <div style={{ alignSelf: 'flex-end' }}><SkeletonLine width={160} height={36} style={{ borderRadius: 16 }} /></div>
            <div style={{ alignSelf: 'flex-start' }}><SkeletonLine width={240} height={44} style={{ borderRadius: 16 }} /></div>
          </div>
        ) : loadError ? (
          <p style={{ color: S.red, margin: 0, padding: '0 24px', textAlign: 'center', paddingTop: 80 }}>{t('chat.load_error')}</p>
        ) : messages.length === 0 ? (
          <p style={{ color: S.tx3, margin: 0, padding: '0 24px', textAlign: 'center', marginTop: 40, fontSize: 14 }}>
            {t('chat.send_first')}
          </p>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === currentUser?.id
            // Implicit read receipt: peer sent a message after this one -> seen
            const peerMsgs = messages.filter(m => m.sender_id !== currentUser?.id)
            const lastPeerTime = peerMsgs.length > 0 ? new Date(peerMsgs[peerMsgs.length - 1].created_at).getTime() : 0
            const msgTime = new Date(message.created_at).getTime()
            const isSeen = isMine && lastPeerTime > msgTime
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isMine={isMine}
                isSeen={isSeen}
                onDoubleClick={() => setReplyTo({ id: message.id, text: message.text, sender_name: message.sender_name })}
                onContextMenu={(e) => { e.preventDefault(); setMenuMsg(message) }}
                onLightbox={(url) => setChatLightbox(url)}
              />
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div style={{ padding: '4px 24px', flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: S.tx3, fontStyle: 'italic' }}>
            {t('chat.typing', { users: typingUsers.join(', ') })}
          </span>
        </div>
      )}
    </>
  )
}
