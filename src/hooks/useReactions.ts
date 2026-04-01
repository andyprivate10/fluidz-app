import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

type ReactionsMap = Map<string, Record<string, string[]>>

export function useReactions(messageIds: string[]) {
  const [reactions, setReactions] = useState<ReactionsMap>(new Map())

  // Load all reactions for the given message IDs
  useEffect(() => {
    if (messageIds.length === 0) return
    let cancelled = false

    async function load() {
      const { data } = await supabase
        .from('message_reactions')
        .select('id, message_id, user_id, emoji')
        .in('message_id', messageIds)
      if (cancelled || !data) return

      const map: ReactionsMap = new Map()
      for (const row of data) {
        if (!map.has(row.message_id)) map.set(row.message_id, {})
        const rec = map.get(row.message_id)!
        if (!rec[row.emoji]) rec[row.emoji] = []
        rec[row.emoji].push(row.user_id)
      }
      setReactions(map)
    }

    load()
    return () => { cancelled = true }
  }, [messageIds.join(',')])

  // Realtime subscription
  useEffect(() => {
    if (messageIds.length === 0) return

    const channel = supabase
      .channel('reactions-' + messageIds[0]?.slice(0, 8))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions',
      }, (payload: any) => {
        const row = (payload.new || payload.old) as { message_id: string; user_id: string; emoji: string } | undefined
        if (!row || !messageIds.includes(row.message_id)) return

        if (payload.eventType === 'INSERT') {
          setReactions(prev => {
            const next = new Map(prev)
            const rec = { ...(next.get(row.message_id) || {}) }
            if (!rec[row.emoji]) rec[row.emoji] = []
            if (!rec[row.emoji].includes(row.user_id)) {
              rec[row.emoji] = [...rec[row.emoji], row.user_id]
            }
            next.set(row.message_id, rec)
            return next
          })
        } else if (payload.eventType === 'DELETE') {
          setReactions(prev => {
            const next = new Map(prev)
            const rec = { ...(next.get(row.message_id) || {}) }
            if (rec[row.emoji]) {
              rec[row.emoji] = rec[row.emoji].filter((uid: string) => uid !== row.user_id)
              if (rec[row.emoji].length === 0) delete rec[row.emoji]
            }
            next.set(row.message_id, rec)
            return next
          })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [messageIds.join(',')])

  const toggleReaction = useCallback(async (messageId: string, emoji: string, userId: string) => {
    // Optimistic check: does user already have this reaction?
    const existing = reactions.get(messageId)?.[emoji]?.includes(userId)

    if (existing) {
      await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji)
    } else {
      await supabase
        .from('message_reactions')
        .insert({ message_id: messageId, user_id: userId, emoji })
    }
  }, [reactions])

  return { reactions, toggleReaction }
}
