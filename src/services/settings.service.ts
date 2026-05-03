/* ============================================================
   settings.service.ts — Capa de acceso a Supabase para ajustes
   FASE 05/06 — GYM-YJMG
   Actualizado: incluye show_daily_quote, reward_chest_enabled,
   rainbow_effect_enabled persistidas en BD para sincronización
   entre dispositivos.
   ============================================================ */
import { supabase } from './supabase'
import type { UserSettingsRow, UserSettingsPayload } from '../types/settings'
import { SETTINGS_DEFAULTS } from '../types/settings'

const SELECT_COLS = [
  'user_id',
  'default_rest_seconds',
  'theme_mode',
  'unit_system',
  'show_daily_quote',
  'reward_chest_enabled',
  'rainbow_effect_enabled',
].join(', ')

export async function getUserSettings(
  userId: string,
): Promise<{ data: UserSettingsRow; error: null } | { data: null; error: string }> {
  const { data, error } = await supabase
    .from('user_settings')
    .select(SELECT_COLS)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return { data: null, error: error.message }

  if (!data) {
    return { data: { user_id: userId, ...SETTINGS_DEFAULTS }, error: null }
  }

  return { data: data as unknown as UserSettingsRow, error: null }
}

export async function saveUserSettings(
  userId: string,
  payload: Partial<UserSettingsPayload>,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: userId, ...SETTINGS_DEFAULTS, ...payload },
      { onConflict: 'user_id' },
    )

  return { error: error?.message ?? null }
}
