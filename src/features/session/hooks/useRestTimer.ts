/* ============================================================
   useRestTimer.ts — Lógica del timer de descanso
   FASE 03 — GYM-YJMG
   Responsabilidad: interval de 1s, pausa, extender, alerta al terminar.
   NO renderiza nada. NO llama a Supabase.
   ============================================================ */
import { useEffect, useRef, useCallback } from 'react'
import { useSessionStore } from '../../../stores/sessionStore'

type UseRestTimerReturn = {
  remaining: number
  total: number
  running: boolean
  start: (seconds: number) => void
  pause: () => void
  reset: () => void
  extend: (seconds: number) => void
  progress: number  // 0-1, para el SVG circle
  mode: 'rest' | 'execution'
}

export function useRestTimer(
  onFinish?: () => void,
  onCountdown?: (remaining: number) => void,
): UseRestTimerReturn {
  const mode = useSessionStore((s) => s.timerMode)
  const remaining = useSessionStore((s) => s.timerRemainingSeconds)
  const total = useSessionStore((s) => s.timerTotalSeconds)
  const running = useSessionStore((s) => s.timerRunning)
  const tickTimer = useSessionStore((s) => s.tickTimer)
  const startTimer = useSessionStore((s) => s.startTimer)
  const pauseTimer = useSessionStore((s) => s.pauseTimer)
  const resetTimer = useSessionStore((s) => s.resetTimer)
  const extendTimer = useSessionStore((s) => s.extendTimer)

  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish

  const onCountdownRef = useRef(onCountdown)
  onCountdownRef.current = onCountdown

  // Intervalo de 1 segundo
  useEffect(() => {
    if (!running) return
    const intervalId = setInterval(() => {
      tickTimer()
    }, 1000)
    return () => clearInterval(intervalId)
  }, [running, tickTimer])

  // Alertas al terminar o durante countdown
  const prevRemaining = useRef(remaining)
  useEffect(() => {
    const prev = prevRemaining.current
    if (mode === 'execution') {
      if (prev < remaining && remaining > 0 && total > 0 && remaining >= total - 10 && remaining < total) {
        onCountdownRef.current?.(total - remaining)
      } else if (prev < total && remaining >= total && total > 0) {
        onFinishRef.current?.()
      }
    } else {
      if (prev > remaining && remaining > 0 && remaining <= 10) {
        onCountdownRef.current?.(remaining)
      } else if (prev > 0 && remaining === 0) {
        onFinishRef.current?.()
      }
    }
    prevRemaining.current = remaining
  }, [remaining, mode, total])

  const start = useCallback((seconds: number) => startTimer(seconds), [startTimer])
  const pause = useCallback(() => pauseTimer(), [pauseTimer])
  const reset = useCallback(() => resetTimer(), [resetTimer])
  const extend = useCallback((secs: number) => extendTimer(secs), [extendTimer])

  const progress = total > 0 ? Math.max(0, remaining) / total : 0

  return { remaining, total, running, start, pause, reset, extend, progress, mode }
}
