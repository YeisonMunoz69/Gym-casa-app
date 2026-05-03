/* ============================================================
   useIsAdmin.ts — Shortcuts de rol para la UI
   FASE 06 — GYM-YJMG
   Wrappers de useUserRole para acceso conciso en componentes.
   ============================================================ */
import { useUserRole } from './useUserRole'

/** true para super_admin y admin */
export function useIsAdmin(): boolean {
  const { role } = useUserRole()
  return role === 'super_admin' || role === 'admin'
}

/** true SOLO para super_admin */
export function useIsSuperAdmin(): boolean {
  const { role } = useUserRole()
  return role === 'super_admin'
}
