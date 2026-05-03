/* ============================================================
   settingsStore.ts — Store global de ajustes de usuario
   FASE 06 — GYM-YJMG
   Fuente única de verdad para preferencias persistidas en BD.
   Todos los hooks de preferencias (quote, chest, rainbow) leen
   de aquí para que los cambios sean reactivos entre componentes
   montados simultáneamente (Header + Settings, Dashboard + Settings).
   ============================================================ */
import { create } from 'zustand'
import { getUserSettings, saveUserSettings } from '../services/settings.service'
import type { UserSettingsRow, UserSettingsPayload } from '../types/settings'
import { SETTINGS_DEFAULTS } from '../types/settings'

type SettingsStore = {
  settings:       UserSettingsRow | null
  loading:        boolean
  saving:         boolean
  initialized:    boolean
  loadSettings:   (userId: string) => Promise<void>
  updateSettings: (userId: string, payload: Partial<UserSettingsPayload>) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings:    null,
  loading:     true,
  saving:      false,
  initialized: false,

  async loadSettings(userId) {
    if (get().initialized) return   // No recargar si ya está cargado
    set({ loading: true })
    const { data, error } = await getUserSettings(userId)
    if (!error && data) {
      set({ settings: data, loading: false, initialized: true })
    } else {
      set({
        settings: { user_id: userId, ...SETTINGS_DEFAULTS },
        loading: false,
        initialized: true,
      })
    }
  },

  async updateSettings(userId, payload) {
    set({ saving: true })
    // Optimistic update — visible al instante en todos los componentes
    set((s) => ({
      settings: s.settings ? { ...s.settings, ...payload } : null,
    }))
    await saveUserSettings(userId, payload)
    set({ saving: false })
  },
}))
