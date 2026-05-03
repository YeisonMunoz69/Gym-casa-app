import { supabase } from './supabase'

export type UserProfile = {
  id: string
  user_id: string
  full_name: string | null
  birth_date: string | null
  gender: 'male' | 'female' | 'other' | null
  height_cm: number | null
  initial_weight_kg: number | null
  goal: 'lose_weight' | 'gain_muscle' | 'maintain' | 'strength' | 'endurance' | null
  experience_level: 'beginner' | 'intermediate' | 'advanced' | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type BodyMeasurement = {
  id: string
  user_id: string
  weight_kg: number
  body_fat_pct: number | null
  notes: string | null
  measured_at: string
  created_at: string
}

export type UpsertProfileInput = Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle() // .single() lanza 406 si no hay filas; .maybeSingle() retorna null

  if (error) return null
  return data as UserProfile | null
}

export async function upsertProfile(
  userId: string,
  input: Partial<UpsertProfileInput>,
): Promise<{ data: UserProfile | null; error: string | null }> {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({ user_id: userId, ...input }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as UserProfile, error: null }
}

export async function uploadAvatar(userId: string, file: Blob): Promise<{ url: string | null; error: string | null }> {
  const path = `${userId}/avatar.jpg`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: 'image/jpeg' })

  if (uploadError) return { url: null, error: uploadError.message }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  
  // Cache busting query param
  const urlWithCacheBust = `${data.publicUrl}?t=${new Date().getTime()}`

  // Update profile
  await upsertProfile(userId, { avatar_url: urlWithCacheBust })

  return { url: urlWithCacheBust, error: null }
}

export async function getBodyMeasurements(userId: string): Promise<BodyMeasurement[]> {
  const { data } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('measured_at', { ascending: false })
    .limit(24) // Ultimos 2 años de mediciones mensuales

  return (data ?? []) as BodyMeasurement[]
}

export async function addBodyMeasurement(
  userId: string,
  weightKg: number,
  bodyFatPct?: number,
  notes?: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('body_measurements')
    .insert({
      user_id: userId,
      weight_kg: weightKg,
      body_fat_pct: bodyFatPct ?? null,
      notes: notes ?? null,
      measured_at: new Date().toISOString().split('T')[0],
    })

  return { error: error?.message ?? null }
}

/** Verifica si el usuario tiene acceso restringido (is_banned en tabla profiles) */
export async function checkIsBanned(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('is_banned')
    .eq('id', userId)
    .maybeSingle()
  return (data as { is_banned?: boolean } | null)?.is_banned === true
}

/** Actualiza el perfil publico del usuario (display_name, household_label) */
export async function updatePublicProfile(
  userId: string,
  input: { display_name?: string | null; household_label?: string },
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .update(input)
    .eq('id', userId)
  return { error: error?.message ?? null }
}
