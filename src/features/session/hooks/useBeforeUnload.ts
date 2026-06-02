/* ============================================================
   useBeforeUnload.ts — Intercepta recarga/cierre cuando hay sesión activa
   GYM-YJMG — FASE 03

   El browser nativo muestra un dialog "¿Salir? Los cambios no guardados
   se perderán" cuando el usuario intenta recargar o cerrar la pestaña.
   Esto protege el progreso de la rutina en memoria (sessionStore).

   Uso: llamar con `active = true` cuando hay sesión activa.
   El listener se desmonta automáticamente al limpiar el efecto.
   ============================================================ */
import { useEffect } from 'react'

/**
 * Registra el evento `beforeunload` para advertir al usuario
 * si intenta recargar o cerrar la página con sesión activa.
 *
 * @param active - Si es `true`, el warning está activo.
 *                 Si es `false`, no se intercepta nada.
 */
export function useBeforeUnload(active: boolean): void {
  useEffect(() => {
    if (!active) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // La spec moderna requiere preventDefault() para mostrar el diálogo nativo.
      // La mayoría de browsers ignoran el mensaje personalizado por seguridad.
      e.preventDefault()
      // returnValue es necesario en Chrome/Edge (legacy)
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup: remover al desactivarse o al desmontar el componente
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [active])
}
