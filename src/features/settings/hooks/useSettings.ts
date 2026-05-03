/* ============================================================
   useSettings.ts — Hook de ajustes de usuario
   FASE 06 — GYM-YJMG (Refactorizado a Zustand store global)
   Delega en settingsStore para que los cambios sean reactivos
   entre todos los componentes montados simultáneamente.
   ============================================================ */
import { useEffect } from 'react'
import { useAuthStore } from '../../../stores/authStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import type { UserSettingsRow, UserSettingsPayload } from '../../../types/settings'

type UseSettingsReturn = {
  settings:       UserSettingsRow | null
  loading:        boolean
  saving:         boolean
  updateSettings: (payload: Partial<UserSettingsPayload>) => Promise<void>
}

export function useSettings(): UseSettingsReturn {
  const userId = useAuthStore((s) => s.user?.id)

  const settings       = useSettingsStore((s) => s.settings)
  const loading        = useSettingsStore((s) => s.loading)
  const saving         = useSettingsStore((s) => s.saving)
  const loadSettings   = useSettingsStore((s) => s.loadSettings)
  const storeUpdate    = useSettingsStore((s) => s.updateSettings)

  // Inicializar una sola vez cuando hay userId
  useEffect(() => {
    if (userId) loadSettings(userId)
  }, [userId, loadSettings])

  async function updateSettings(payload: Partial<UserSettingsPayload>) {
    if (!userId) return
    await storeUpdate(userId, payload)
  }

  return { settings, loading, saving, updateSettings }
}
