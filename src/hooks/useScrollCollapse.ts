/* ============================================================
   useScrollCollapse.ts — Progreso de colapso 0-1 según scroll vertical
   Responsabilidad: leer window.scrollY (throttled con rAF) y devolver
   un valor 0 (arriba del todo) a 1 (scrolleado >= thresholdPx).
   Genérico y reutilizable — NO conoce nada de timers ni sesiones.
   ============================================================ */
import { useEffect, useState } from 'react'

export function useScrollCollapse(thresholdPx: number = 80): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let ticking = false

    function update() {
      const clamped = Math.min(1, Math.max(0, window.scrollY / thresholdPx))
      setProgress(clamped)
      ticking = false
    }

    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [thresholdPx])

  return progress
}
