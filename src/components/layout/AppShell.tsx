/* ============================================================
   AppShell.tsx — Shell principal con Header, BottomNav y rutas
   Responsabilidad: Layout chrome (header + nav) + guarda de
   sesión activa via useBlocker de React Router v6.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useNavigate, useBlocker, Outlet } from 'react-router-dom'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import type { TabId } from './BottomNav'
import { useSessionStore } from '../../stores/sessionStore'
import { useActiveSession } from '../../features/session/hooks/useActiveSession'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import './AppShell.css'

const TAB_PATHS: Record<TabId, string> = {
  dashboard: '/dashboard',
  routines:  '/routines',
  session:   '/session',
  exercises: '/exercises',
  settings:  '/settings',
}

export function AppShell() {
  const navigate = useNavigate()
  const sessionStatus = useSessionStore((s) => s.status)
  const { abortSession } = useActiveSession()

  /* ── Bloquear navegación si hay sesión activa ── */
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      sessionStatus === 'active' &&
      currentLocation.pathname !== nextLocation.pathname,
  )

  async function confirmNavigation() {
    if (blocker.state !== 'blocked') return
    await abortSession()
    blocker.proceed()
  }

  function cancelNavigation() {
    if (blocker.state !== 'blocked') return
    blocker.reset()
  }

  /* ── Interceptor del BottomNav: si hay sesión, useBlocker se encarga ── */
  function handleTabChange(tabId: TabId) {
    navigate(TAB_PATHS[tabId])
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="app-shell__content">
        <Outlet />
      </main>
      <BottomNav onTabChange={handleTabChange} />

      <ConfirmDialog
        isOpen={blocker.state === 'blocked'}
        title="Sesión en curso"
        message="Tienes un entrenamiento activo. Si cambias de pestaña, podrías perder progreso no guardado. ¿Deseas salir de todas formas?"
        confirmLabel="Salir"
        variant="danger"
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />
    </div>
  )
}
