import { supabase } from './supabase'

/**
 * Send a push notification to a user via the Supabase Edge Function.
 * Falls back silently if push is not configured or user has no subscription.
 */
export async function sendPushToUser(userId: string, title: string, body: string, url?: string) {
  try {
    await supabase.functions.invoke('send-push', {
      body: { user_id: userId, title, body, url },
    })
  } catch {
    // Silent fail — push is best-effort
  }
}
