/* ============================================================
   useAIButtonEffect.ts — Preferencia del efecto arcoiris del botón IA
   FASE 06 — GYM-YJMG (Migrado a BD)
   Lee/escribe desde useSettings → Supabase.
   Reactivo entre componentes porque useSettings usa useState compartido
   dentro del mismo árbol de renderizado.
   ============================================================ */
import { useCallback } from 'react'
import { useSettings } from '../../settings/hooks/useSettings'

export function useAIButtonEffect() {
  const { settings, updateSettings } = useSettings()

  const rainbowEnabled = settings?.rainbow_effect_enabled ?? true

  const setRainbowEnabled = useCallback(
    (value: boolean) => {
      updateSettings({ rainbow_effect_enabled: value })
    },
    [updateSettings],
  )

  return { rainbowEnabled, setRainbowEnabled }
}
