/* ============================================================
   useChestEnabled.ts — Preferencia del cofre de recompensa
   FASE 06 — GYM-YJMG (Migrado a BD)
   Lee/escribe desde useSettings → Supabase.
   ============================================================ */
import { useCallback } from 'react'
import { useSettings } from '../../settings/hooks/useSettings'

export function useChestEnabled() {
  const { settings, updateSettings } = useSettings()

  const chestEnabled = settings?.reward_chest_enabled ?? true

  const setChestEnabled = useCallback(
    (value: boolean) => {
      updateSettings({ reward_chest_enabled: value })
    },
    [updateSettings],
  )

  return { chestEnabled, setChestEnabled }
}
