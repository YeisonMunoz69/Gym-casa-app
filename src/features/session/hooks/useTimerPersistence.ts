/* ============================================================
   useTimerPersistence.ts — Persiste el timer ante recarga de página
   FASE 03.2 — GYM-YJMG
   Guarda deadline en localStorage; al cargar recalcula el restante.
   Responsabilidad: leer/escribir localStorage. NO gestiona el interval.
   ============================================================ */
import { useEffect } from 'react'
import { useSessionStore } from '../../../stores/sessionStore'

const TIMER_STORAGE_KEY = 'gym-yjmg:rest-timer'

type PersistedTimer = {
  deadlineMs: number        // timestamp absoluto de fin
  totalSeconds: number
  sessionId: string
}

function getStorageKey(sessionId: string): string {
  return `${TIMER_STORAGE_KEY}:${sessionId}`
}

/** Llama en RestTimer para persistir y restaurar el timer. */
export function useTimerPersistence(): void {
  const sessionId = useSessionStore((s) => s.sessionId)
  const running = useSessionStore((s) => s.timerRunning)
  const remaining = useSessionStore((s) => s.timerRemainingSeconds)
  const total = useSessionStore((s) => s.timerTotalSeconds)
  const startTimer = useSessionStore((s) => s.startTimer)
  const pauseTimer = useSessionStore((s) => s.pauseTimer)

  // Al montar: restaurar si hay timer persistido para esta sesión
  useEffect(() => {
    if (!sessionId) return
    const raw = localStorage.getItem(getStorageKey(sessionId))
    if (!raw) return

    try {
      const saved = JSON.parse(raw) as PersistedTimer
      if (saved.sessionId !== sessionId) return

      const nowMs = Date.now()
      const remainingMs = saved.deadlineMs - nowMs
      if (remainingMs > 500) {
        startTimer(Math.ceil(remainingMs / 1000))
      } else {
        pauseTimer()
        localStorage.removeItem(getStorageKey(sessionId))
      }
    } catch {
      // JSON inválido, ignorar
    }
  }, [sessionId]) // eslint-disable-line

  // Al cambiar estado: guardar si corre, borrar si pausa/termina
  useEffect(() => {
    if (!sessionId) return
    const key = getStorageKey(sessionId)

    if (running && remaining > 0) {
      const saved: PersistedTimer = {
        deadlineMs: Date.now() + remaining * 1000,
        totalSeconds: total,
        sessionId,
      }
      localStorage.setItem(key, JSON.stringify(saved))
    } else {
      localStorage.removeItem(key)
    }
  }, [running, remaining, total, sessionId])
}
