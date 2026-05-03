/* ============================================================
   useTimerSound.ts — Alertas sonoras del timer de descanso
   FASE 03.3 — GYM-YJMG
   - playCountdownBeep: pitido corto (5,4,3,2,1 seg antes)
   - playTimerFinished: triple beep llamativo + vibración larga
   Sin dependencias externas. WebAudio API + Vibration API.
   ============================================================ */

type AudioContextCompat = typeof AudioContext

function getAudioContext(): AudioContext | null {
  const Win = window as typeof window & { webkitAudioContext?: AudioContextCompat }
  const Cls = Win.AudioContext ?? Win.webkitAudioContext
  return Cls ? new Cls() : null
}

function scheduleTone(
  ctx: AudioContext,
  freq: number,
  startSec: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'square',
): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startSec)
  osc.connect(gain)
  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + startSec)
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + startSec + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startSec + duration)
  osc.start(ctx.currentTime + startSec)
  osc.stop(ctx.currentTime + startSec + duration + 0.05)
}

/** Pitido de cuenta regresiva progresivo (10 a 1 seg) */
function playCountdownTick(remainingSecs: number = 5): void {
  const ctx = getAudioContext()
  if (!ctx) return

  if (remainingSecs <= 3) {
    // Últimos 3 segundos: alarma cuadrada corta y punzante
    scheduleTone(ctx, 880, 0, 0.12, 0.5, 'square')
    setTimeout(() => void ctx.close(), 500)
    if ('vibrate' in navigator) navigator.vibrate([40, 40])
  } else {
    // Segundos 10 a 4: pitido corto sine
    scheduleTone(ctx, 1100, 0, 0.08, 0.4, 'sine')
    setTimeout(() => void ctx.close(), 500)
    if ('vibrate' in navigator) navigator.vibrate(20)
  }
}

/** Triple beep llamativo al llegar a 0 */
function playFinishChime(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  // Beep 1: alarma fuerte
  scheduleTone(ctx, 880, 0,    0.28, 0.8)
  // Beep 2: alarma fuerte
  scheduleTone(ctx, 988, 0.35, 0.28, 0.8)
  // Beep 3: alarma muy fuerte y sostenida
  scheduleTone(ctx, 1108, 0.70, 0.40, 0.95)
  setTimeout(() => void ctx.close(), 1600)
  if ('vibrate' in navigator) navigator.vibrate([150, 60, 150, 60, 300])
}

export function useTimerSound() {
  return {
    playCountdownBeep: playCountdownTick,
    playTimerFinished: playFinishChime,
  }
}
