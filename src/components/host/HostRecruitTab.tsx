import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Share2, ChevronDown, ChevronUp } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { colors, glassCard } from '../../brand'

const S = colors

type Props = {
  linkCopied: boolean
  copyLink: (text: string) => void
  messageCopied: boolean
  copyMessageText: (text: string) => void
  getPreparedMessage: () => string
  getInviteUrl: () => string
  getDirectInviteUrl: () => string
  shareSession: () => void
  myContacts: { user_id: string; contact_user_id: string; display_name: string }[]
  myGroups: { id: string; name: string; color: string; member_ids: string[] }[]
  inviteContact: (contactUserId: string) => void
  inviteGroup: (groupId: string) => void
}

export default function HostRecruitTab({
  linkCopied, copyLink, messageCopied, copyMessageText,
  getPreparedMessage, getInviteUrl, getDirectInviteUrl, shareSession,
  myContacts, myGroups, inviteContact, inviteGroup,
}: Props) {
  const { t } = useTranslation()
  const [showQr, setShowQr] = useState(false)
  const hasShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 20px' }}>
      {/* SECTION: Application Link */}
      <div style={{
        ...glassCard,
        borderColor: S.pbd,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          {t('host.apply_link_title')}
        </div>
        <p style={{ fontSize: 12, color: S.tx3, margin: '0 0 12px', lineHeight: 1.4 }}>
          {t('host.apply_link_desc')}
        </p>

        {/* Prepared message preview */}
        <div style={{
          fontSize: 11, fontWeight: 600, color: S.tx3, marginBottom: 4,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {t('host.prepared_message_label')}
        </div>
        <div style={{
          padding: '10px 12px', borderRadius: 10,
          background: S.bg1, border: '1px solid ' + S.rule,
          fontSize: 12, color: S.tx2, lineHeight: 1.5,
          whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto',
          userSelect: 'none', pointerEvents: 'none',
        }}>
          {getPreparedMessage()}
        </div>

        {/* Copy + Share buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            onClick={() => copyMessageText(getPreparedMessage())}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              border: '1px solid ' + S.pbd,
              background: messageCopied ? S.sagebg : 'transparent',
              color: messageCopied ? S.sage : S.p,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Copy size={14} strokeWidth={2} />
            {messageCopied ? t('host.copied') : t('host.copy_msg')}
          </button>
          {hasShare && (
            <button
              onClick={shareSession}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                border: '1px solid ' + S.sagebd, background: 'transparent', color: S.sage,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Share2 size={14} strokeWidth={2} />
              {t('host.share_msg')}
            </button>
          )}
        </div>

        {/* Invite URL */}
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: S.tx3, marginBottom: 4 }}>
            {t('host.invite_url_label')}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', borderRadius: 8,
            background: S.bg1, border: '1px solid ' + S.rule,
          }}>
            <span style={{ flex: 1, fontSize: 11, color: S.tx2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {getInviteUrl()}
            </span>
            <button
              onClick={() => copyLink(getInviteUrl())}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: '1px solid ' + S.pbd,
                background: linkCopied ? S.sagebg : 'transparent',
                color: linkCopied ? S.sage : S.p, cursor: 'pointer',
              }}
            >
              {linkCopied ? t('host.copied') : t('host.copy_msg')}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: Direct Invite */}
      <div style={{
        ...glassCard,
        borderColor: S.sagebd,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: S.sage, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          {t('host.direct_invite_title')}
        </div>
        <p style={{ fontSize: 12, color: S.tx3, margin: '0 0 12px', lineHeight: 1.4 }}>
          {t('host.direct_invite_desc')}
        </p>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderRadius: 8,
          background: S.bg1, border: '1px solid ' + S.rule,
        }}>
          <span style={{ flex: 1, fontSize: 11, color: S.tx2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {getDirectInviteUrl()}
          </span>
          <button
            onClick={() => copyLink(getDirectInviteUrl())}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: '1px solid ' + S.sagebd,
              background: linkCopied ? S.sagebg : 'transparent',
              color: linkCopied ? S.sage : S.sage, cursor: 'pointer',
            }}
          >
            {linkCopied ? t('host.copied') : t('host.copy_msg')}
          </button>
        </div>

        {/* QR expandable */}
        <button
          onClick={() => setShowQr(!showQr)}
          style={{
            marginTop: 8, width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 12,
            fontWeight: 600, border: '1px solid ' + S.rule, background: 'transparent',
            color: S.tx3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          {showQr ? <><ChevronUp size={14} />{t('host.hide_qr')}</> : <><ChevronDown size={14} />{t('host.show_qr')}</>}
        </button>
        {showQr && (
          <div style={{ marginTop: 10, textAlign: 'center', padding: 12, borderRadius: 10, background: S.bg1, border: '1px solid ' + S.rule }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: 12, display: 'inline-block' }}>
              <QRCodeSVG value={getInviteUrl()} size={120} level="M" fgColor="#0C0A14" bgColor="#ffffff" />
            </div>
          </div>
        )}
      </div>

      {/* SECTION: Naughty Book */}
      <div style={{
        ...glassCard,
        borderColor: S.lavbd,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: S.lav, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          {t('host.naughtybook_title')}
        </div>

        {myContacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: S.tx3, fontSize: 12 }}>
            {t('host.no_contacts')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {myContacts.slice(0, 20).map((contact, idx) => (
              <div key={contact.contact_user_id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: idx < Math.min(myContacts.length, 20) - 1 ? '1px solid ' + S.rule : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: S.bg3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: S.lav,
                  }}>
                    {(contact.display_name || '?')[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: S.tx }}>{contact.display_name}</span>
                </div>
                <button
                  onClick={() => inviteContact(contact.contact_user_id)}
                  style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                    border: '1px solid ' + S.lavbd, background: S.lavbg, color: S.lav,
                    cursor: 'pointer',
                  }}
                >
                  {t('host.invite_contact')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION: Groups */}
      <div style={{
        ...glassCard,
        borderColor: S.lavbd,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: S.lav, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          {t('host.groups_title')}
        </div>

        {myGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: S.tx3, fontSize: 12 }}>
            {t('host.no_groups')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myGroups.map(g => (
              <div key={g.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 10,
                background: S.bg1, border: '1px solid ' + g.color + '33',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 4, background: g.color }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: S.tx }}>{g.name}</span>
                  <span style={{ fontSize: 11, color: S.tx3 }}>({g.member_ids.length})</span>
                </div>
                <button
                  onClick={() => inviteGroup(g.id)}
                  style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                    border: '1px solid ' + g.color + '44', background: g.color + '14', color: g.color,
                    cursor: 'pointer',
                  }}
                >
                  {t('host.invite_group_all')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
