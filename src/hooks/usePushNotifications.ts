import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// VAPID public key — generate with: npx web-push generate-vapid-keys
// Store the private key server-side. This is the public key only.
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export type PushStatus = 'unsupported' | 'denied' | 'default' | 'granted' | 'subscribed'

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>('unsupported')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    const perm = Notification.permission
    if (perm === 'denied') setStatus('denied')
    else if (perm === 'granted') {
      // Check if already subscribed
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setStatus(sub ? 'subscribed' : 'granted')
        })
      })
    } else setStatus('default')
  }, [])

  const subscribe = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
      console.warn('VITE_VAPID_PUBLIC_KEY not set')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return false
      }

      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
      }

      // Save subscription to user_profiles
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('user_profiles').update({
          push_subscription: sub.toJSON(),
        }).eq('id', user.id)
      }

      setStatus('subscribed')
      return true
    } catch (err) {
      console.error('Push subscription failed:', err)
      return false
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('user_profiles').update({
          push_subscription: null,
        }).eq('id', user.id)
      }

      setStatus('granted')
    } catch (err) {
      console.error('Push unsubscribe failed:', err)
    }
  }, [])

  return { status, subscribe, unsubscribe }
}
