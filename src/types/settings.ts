/* ============================================================
   settings.ts — Tipos del dominio de ajustes de usuario
   FASE 05/06 — GYM-YJMG
   Actualizado: incluye preferencias de UI persistidas en BD.
   ============================================================ */

/** Fila completa de user_settings en Supabase */
export type UserSettingsRow = {
  user_id:               string
  default_rest_seconds:  number
  theme_mode:            string
  unit_system:           string
  show_daily_quote:      boolean
  reward_chest_enabled:  boolean
  rainbow_effect_enabled: boolean
  help_animations_enabled: boolean
}

/** Payload para upsert — columnas que la app gestiona */
export type UserSettingsPayload = Omit<UserSettingsRow, 'user_id'>

/** Valores por defecto cuando no existe fila en BD */
export const SETTINGS_DEFAULTS: Omit<UserSettingsRow, 'user_id'> = {
  default_rest_seconds:   90,
  theme_mode:             'dark',
  unit_system:            'metric',
  show_daily_quote:       true,
  reward_chest_enabled:   true,
  rainbow_effect_enabled: true,
  help_animations_enabled: true,
}

export type WeightUnit = 'kg' | 'lb'

/** Opciones disponibles para el selector de descanso */
export const REST_TIMER_OPTIONS = [
  { label: '60s',   value: 60  },
  { label: '90s',   value: 90  },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
] as const

export type RestTimerOption = (typeof REST_TIMER_OPTIONS)[number]['value']
