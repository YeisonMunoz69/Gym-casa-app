/* ============================================================
   useHelpAnimation.ts — Preferencia del efecto de los botones de tutorial
   FASE 06 — GYM-YJMG
   ============================================================ */
import { useCallback } from 'react'
import { useSettings } from '../../../../features/settings/hooks/useSettings'

export function useHelpAnimation() {
  const { settings, updateSettings } = useSettings()

  const helpAnimationsEnabled = settings?.help_animations_enabled ?? true

  const setHelpAnimationsEnabled = useCallback(
    (value: boolean) => {
      updateSettings({ help_animations_enabled: value })
    },
    [updateSettings],
  )

  return { helpAnimationsEnabled, setHelpAnimationsEnabled }
}
