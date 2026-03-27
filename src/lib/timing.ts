/** Shared session timing utilities */
import i18next from 'i18next'

const tt = (key: string, opts?: Record<string, unknown>) => i18next.t(key, opts) as string

export function formatElapsed(startRef: string): string {
  const elMs = Date.now() - new Date(startRef).getTime()
  if (elMs >= 0) {
    const mins = Math.floor(elMs / 60000)
    if (mins < 60) return mins + 'min'
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h + 'h' + (m > 0 ? m.toString().padStart(2, '0') : '')
  }
  const untilStart = Math.floor(-elMs / 60000)
  if (untilStart < 60) return tt('timing.in_time', { time: untilStart + 'min' })
  return tt('timing.in_time', { time: Math.floor(untilStart / 60) + 'h' })
}

export function formatRemaining(endsAt: string): string {
  const remMs = new Date(endsAt).getTime() - Date.now()
  if (remMs <= 0) return tt('timing.ended')
  const remMins = Math.floor(remMs / 60000)
  if (remMins < 60) return remMins + 'min'
  const h = Math.floor(remMins / 60)
  const m = remMins % 60
  return h + 'h' + (m > 0 ? m.toString().padStart(2, '0') : '')
}

/** Compact relative time: "à l'instant", "5min", "3h", "2j", then date */
export function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return tt('timing.just_now')
  if (mins < 60) return mins + 'min'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + 'h'
  const days = Math.floor(hours / 24)
  if (days < 7) return days + tt('timing.days_short')
  const lng = i18next.language || 'fr'
  return new Date(dateStr).toLocaleDateString(lng, { day: 'numeric', month: 'short' })
}

export function sessionTiming(sess: { starts_at?: string; ends_at?: string; created_at: string }): string {
  const now = Date.now()
  if (sess.starts_at) {
    const startMs = new Date(sess.starts_at).getTime()
    if (startMs > now) {
      const mins = Math.floor((startMs - now) / 60000)
      if (mins < 60) return tt('timing.in_time', { time: mins + 'min' })
      const h = Math.floor(mins / 60)
      return tt('timing.in_time', { time: h + 'h' })
    }
  }
  if (sess.ends_at) {
    const endMs = new Date(sess.ends_at).getTime()
    const remMs = endMs - now
    if (remMs <= 0) return tt('timing.ended')
    const remMins = Math.floor(remMs / 60000)
    if (remMins < 60) return tt('timing.remaining', { time: remMins + 'min' })
    const h = Math.floor(remMins / 60)
    return tt('timing.remaining', { time: h + 'h' })
  }
  return timeAgo(sess.created_at)
}

/** Rich relative time for chat messages: clock time for today, "hier HH:MM", weekday, then full date */
export function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const sameDay = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear()
  const lng = i18next.language || 'fr'

  if (diffMin < 1) return tt('timing.just_now')
  if (diffMin < 60) return tt('timing.ago_min', { count: diffMin })
  if (sameDay) return d.toLocaleTimeString(lng, { hour: '2-digit', minute: '2-digit' })
  if (isYesterday) return tt('timing.yesterday') + ' ' + d.toLocaleTimeString(lng, { hour: '2-digit', minute: '2-digit' })
  if (diffMs < 7 * 24 * 3600000) return d.toLocaleDateString(lng, { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString(lng, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** Number of months since a date (for numeric display) */
export function monthsAgoCount(isoDate: string): number | null {
  if (!isoDate) return null
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  return Math.max(0, (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()))
}

/** "ce mois-ci" or "il y a N mois" */
export function monthsAgoLabel(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const months = Math.max(0, (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()))
  if (months === 0) return tt('timing.this_month')
  return tt('timing.months_ago', { count: months })
}
