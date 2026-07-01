/* ============================================================
   useTimerPersistence.ts — Persiste el timer ante recarga de página
   FASE 03.2 — GYM-YJMG
   Guarda deadline en localStorage; al cargar recalcula el restante.
   Responsabilidad: leer/escribir localStorage. NO gestiona el interval.

   FIX (2026-07-01): iOS Safari/PWA throttlea o pausa el setInterval de
   1s de useRestTimer.ts cuando la app pasa a segundo plano (el usuario
   sale a otra app). Antes, el restante solo se recalculaba desde el
   deadline persistido AL MONTAR — pero el componente nunca se desmonta
   al volver de background, así que el timer quedaba "congelado". Ahora
   se escucha `visibilitychange` y se resincroniza contra el deadline
   real cada vez que la app vuelve a primer plano.
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
  const syncTimerRemaining = useSessionStore((s) => s.syncTimerRemaining)

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

  // Al volver de segundo plano (ej. iOS tras salir a otra app): resincronizar
  // el restante contra el deadline real, en vez de confiar en el setInterval
  // que iOS pudo haber throttleado/pausado mientras la app no era visible.
  useEffect(() => {
    if (!sessionId) return

    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') return
      const raw = localStorage.getItem(getStorageKey(sessionId!))
      if (!raw) return

      try {
        const saved = JSON.parse(raw) as PersistedTimer
        if (saved.sessionId !== sessionId) return
        const remainingSeconds = Math.max(0, Math.round((saved.deadlineMs - Date.now()) / 1000))
        syncTimerRemaining(remainingSeconds)
      } catch {
        // JSON inválido, ignorar
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [sessionId, syncTimerRemaining])
}
