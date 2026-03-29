import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * useTypingIndicator — Supabase Realtime Presence for "X is typing..."
 * channelName must be unique per conversation (e.g. `typing:dm:${sessionId}:${peerId}`)
 */
export function useTypingIndicator(channelName: string, userId: string | undefined, displayName: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!userId || !channelName) return

    const channel = supabase.channel(channelName, { config: { presence: { key: userId } } })
    channelRef.current = channel

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<{ typing: boolean; name: string }>()
      const names: string[] = []
      for (const [uid, entries] of Object.entries(state)) {
        if (uid !== userId && entries.some((e: { typing: boolean }) => e.typing)) {
          const name = entries[0]?.name || 'Quelqu\'un'
          names.push(name)
        }
      }
      setTypingUsers(names)
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ typing: false, name: displayName })
      }
    })

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [channelName, userId, displayName])

  const sendTyping = useCallback(() => {
    if (!channelRef.current) return
    channelRef.current.track({ typing: true, name: displayName })

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      channelRef.current?.track({ typing: false, name: displayName })
    }, 2000)
  }, [displayName])

  const stopTyping = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    channelRef.current?.track({ typing: false, name: displayName })
  }, [displayName])

  return { typingUsers, sendTyping, stopTyping }
}
