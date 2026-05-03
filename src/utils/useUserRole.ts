/* ============================================================
   useUserRole.ts — Rol del usuario autenticado
   FASE 06 — GYM-YJMG
   Consulta user_roles en Supabase. Super-admin detectado
   de forma inmediata (sin flash) via ID hardcodeado.
   ============================================================ */
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuthStore } from '../stores/authStore'

export type UserRole = 'super_admin' | 'admin' | 'user'

const SUPER_ADMIN_ID = import.meta.env.VITE_SUPER_ADMIN_ID as string ?? ''

type Return = { role: UserRole; loading: boolean }

export function useUserRole(): Return {
  const userId      = useAuthStore((s: any) => s.user?.id)
  const isSuperAdmin = userId === SUPER_ADMIN_ID

  const [role,    setRole]    = useState<UserRole>(isSuperAdmin ? 'super_admin' : 'user')
  const [loading, setLoading] = useState(!isSuperAdmin)

  useEffect(() => {
    if (!userId || isSuperAdmin) { setLoading(false); return }

    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        setRole((data?.role as UserRole) ?? 'user')
        setLoading(false)
      })
  }, [userId, isSuperAdmin])

  return { role, loading }
}
