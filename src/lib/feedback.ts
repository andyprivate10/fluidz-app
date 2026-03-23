// Notification sound — plays a subtle "ding" using Web Audio API
// No external file needed, generates tone programmatically

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioCtx
}

/** Play a subtle notification ding */
export function playNotificationSound() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.1) // soft drop

    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.25)
  } catch {
    // Audio not available — silent fallback
  }
}

/** Play a deeper message received sound */
export function playMessageSound() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(523, ctx.currentTime) // C5
    osc.frequency.exponentialRampToValueAtTime(659, ctx.currentTime + 0.08) // rise to E5

    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
  } catch {
    // Silent fallback
  }
}

/** Trigger haptic feedback (mobile only) */
export function haptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  try {
    if (!navigator.vibrate) return
    const duration = style === 'light' ? 10 : style === 'medium' ? 25 : 50
    navigator.vibrate(duration)
  } catch {
    // Not supported
  }
}

/** Combined: sound + haptic for important events */
export function notifyUser(type: 'message' | 'notification' | 'success' = 'notification') {
  if (type === 'message') {
    playMessageSound()
    haptic('light')
  } else if (type === 'success') {
    playNotificationSound()
    haptic('medium')
  } else {
    playNotificationSound()
    haptic('light')
  }
}
