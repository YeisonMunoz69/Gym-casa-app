/* ============================================================
   admin.service.ts — Servicios de gestion de usuarios (solo admin)
   FASE 06 — GYM-YJMG
   ============================================================ */
import { supabase } from './supabase'

export type ProfileRow = {
  id:              string
  display_name:    string | null
  household_label: string
  is_active:       boolean
  is_banned:       boolean
}

export type RoleRow = {
  user_id:    string
  role:       string
  granted_at: string
}

export type AdminUser = ProfileRow & { role: 'super_admin' | 'admin' | 'user' }

/** Lista todos los perfiles (solo super-admin gracias a la politica RLS) */
export async function getAllUsers(): Promise<{ data: AdminUser[]; error: string | null }> {
  const [profilesRes, rolesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, household_label, is_active, is_banned')
      .order('display_name'),
    supabase
      .from('user_roles')
      .select('user_id, role, granted_at'),
  ])

  if (profilesRes.error) return { data: [], error: profilesRes.error.message }

  const rolesMap = new Map<string, string>()
  for (const r of (rolesRes.data ?? []) as RoleRow[]) {
    rolesMap.set(r.user_id, r.role)
  }

  const users = (profilesRes.data as ProfileRow[]).map((p) => ({
    ...p,
    role: (rolesMap.get(p.id) ?? 'user') as AdminUser['role'],
  }))

  return { data: users, error: null }
}

/** Promueve un usuario a admin */
export async function grantAdmin(
  targetUserId: string,
  grantedBy: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('user_roles').upsert({
    user_id:    targetUserId,
    role:       'admin',
    granted_by: grantedBy,
  })
  return { error: error?.message ?? null }
}

/** Revoca el rol de admin de un usuario */
export async function revokeAdmin(
  targetUserId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', targetUserId)
    .eq('role', 'admin')   // nunca borra super_admin
  return { error: error?.message ?? null }
}

/** Bloquea o desbloquea un usuario (es llamada tambien desde user-stats.service) */
export async function setUserBanned(
  userId: string,
  banned: boolean,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: banned })
    .eq('id', userId)
  return { error: error?.message ?? null }
}
