// Supabase Edge Function — Send push notifications
// Triggered by database webhook on notifications INSERT
// or called directly via POST /functions/v1/send-push

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Web Push requires JWK signing — we use the raw crypto API
async function sendWebPush(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string) {
  // For Deno Edge Functions, use the fetch-based approach
  // The subscription endpoint is the push service URL
  const body = new TextEncoder().encode(payload)

  // Build JWT for VAPID
  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' })).replace(/=/g, '')
  const url = new URL(subscription.endpoint)
  const audience = `${url.protocol}//${url.host}`
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600
  const claims = btoa(JSON.stringify({ aud: audience, exp, sub: 'mailto:admin@fluidz.app' })).replace(/=/g, '')

  // Simplified: send notification via fetch to the push endpoint
  // In production, use a proper web-push library for Deno
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
    },
    body: body,
  })

  return response.ok
}

serve(async (req: Request) => {
  try {
    const { user_id, title, body, url, tag } = await req.json()

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get push subscription for user
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('push_subscription')
      .eq('id', user_id)
      .maybeSingle()

    if (!profile?.push_subscription) {
      return new Response(JSON.stringify({ sent: false, reason: 'no_subscription' }), { status: 200 })
    }

    const payload = JSON.stringify({
      title: title || 'fluidz',
      body: body || '',
      url: url || '/',
      tag: tag || 'fluidz-notif',
    })

    const success = await sendWebPush(profile.push_subscription, payload)

    return new Response(JSON.stringify({ sent: success }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
