/* ============================================================
   useHelpAnimation.ts — Preferencia del efecto de los botones de tutorial
   FASE 06 — GYM-YJMG
   Fix: persiste en localStorage para que el valor sea inmediato
   en la recarga, sin esperar a que Supabase cargue los settings.
   ============================================================ */
import { useCallback, useEffect } from 'react'
import { useSettings } from '../../../../features/settings/hooks/useSettings'

const LS_KEY = 'gym_help_animations_enabled'

/** Lee de localStorage como fuente inmediata — evita el flash de `true` en recarga */
function readLocalValue(): boolean {
  const stored = localStorage.getItem(LS_KEY)
  if (stored === null) return true // primera visita: activado por defecto
  return stored === 'true'
}

export function useHelpAnimation() {
  const { settings, updateSettings } = useSettings()

  // Fuente de verdad: Supabase cuando ya cargó, localStorage mientras tanto
  const helpAnimationsEnabled = settings !== null
    ? (settings.help_animations_enabled ?? true)
    : readLocalValue()

  // Sincronizar localStorage cuando Supabase ya tiene el valor
  useEffect(() => {
    if (settings !== null) {
      localStorage.setItem(LS_KEY, String(settings.help_animations_enabled ?? true))
    }
  }, [settings])

  const setHelpAnimationsEnabled = useCallback(
    (value: boolean) => {
      // Escribir en localStorage de inmediato — persiste en recarga
      localStorage.setItem(LS_KEY, String(value))
      // Sincronizar con Supabase en segundo plano
      updateSettings({ help_animations_enabled: value })
    },
    [updateSettings],
  )

  return { helpAnimationsEnabled, setHelpAnimationsEnabled }
}
