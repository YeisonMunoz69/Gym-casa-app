/* ============================================================
   App.tsx — Punto de entrada de la aplicación autenticada
   Responsabilidad: Proveedores globales + árbol de rutas.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ThemeProvider } from './app/ThemeProvider'
import { AuthProvider } from './app/AuthProvider'
import { AppShell } from './components/layout/AppShell'
import { ToastContainer } from './components/ui/Toast'
import { LoginScreen } from './features/auth/components/LoginScreen'
import { LoadingScreen } from './components/shared/LoadingScreen'
import { OnboardingFlow } from './features/profile/components/OnboardingFlow'
import { RoutinesList } from './features/routines/components/RoutinesList'
import { RoutineDetail } from './features/routines/components/RoutineDetail'
import { SessionStarter } from './features/session/components/SessionStarter'
import { ActiveSessionView } from './features/session/components/ActiveSessionView'
import { DashboardScreen } from './features/dashboard'
import { SettingsScreen } from './features/settings/SettingsScreen'
import { CatalogScreen } from './features/exercises/CatalogScreen'
import { HistoryScreen } from './features/dashboard/components/HistoryScreen'
import { RecordsScreen } from './features/dashboard/components/RecordsScreen'
import { useRoutines } from './features/routines/hooks/useRoutines'
import { ImportRoutineScreen } from './features/routines/components/ImportRoutineScreen'
import { AIChatScreen } from './features/ai/components/AIChatScreen'
import { AdminScreen } from './features/admin/AdminScreen'
import { BannedScreen } from './features/admin/BannedScreen'
import { WelcomeVideoModal, hasSeenWelcome } from './components/ui/WelcomeVideoModal'
import { checkIsBanned } from './services/profiles.service'
import { useAuthStore } from './stores/authStore'
import { useSessionStore } from './stores/sessionStore'
import { useUserProfile } from './features/profile/hooks/useUserProfile'
import type { RoutineWithDays } from './types/routine'

/* ── Sub-pantallas con navegación interna ──────────────────── */

function RoutinesTab() {
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null)
  const hook = useRoutines()

  const selectedRoutine = selectedRoutineId
    ? hook.routines.find((r) => r.id === selectedRoutineId) ?? null
    : null

  if (selectedRoutine) {
    return (
      <RoutineDetail
        routine={selectedRoutine}
        onBack={() => setSelectedRoutineId(null)}
        onRoutineChanged={hook.refresh}
      />
    )
  }

  return (
    <RoutinesList
      routines={hook.routines}
      loading={hook.loading}
      onSelectRoutine={(r: RoutineWithDays) => setSelectedRoutineId(r.id)}
      onAddRoutine={hook.addRoutine}
      onRemoveRoutine={hook.removeRoutine}
      onToggleActive={hook.setActive}
      onRefresh={hook.refresh}
    />
  )
}

function SessionTab() {
  const sessionStatus = useSessionStore((s) => s.status)
  const [sessionStarted, setSessionStarted] = useState(false)

  if (sessionStarted && sessionStatus !== 'idle') {
    return <ActiveSessionView />
  }

  return (
    <SessionStarter onSessionStarted={() => setSessionStarted(true)} />
  )
}

/* ── Subpantallas flotantes que preservan el chrome ───────── */

function HistoryRoute() {
  const navigate = useNavigate()
  return <HistoryScreen onClose={() => navigate(-1)} />
}

function RecordsRoute() {
  const navigate = useNavigate()
  return <RecordsScreen onClose={() => navigate(-1)} />
}
function AIChatRoute() {
  const navigate = useNavigate()
  void navigate  // ruta completamente standalone — AppShell se oculta por position:fixed
  return <AIChatScreen />
}


/* ── App autenticada con árbol de rutas ──────────────────── */

function AuthenticatedApp() {
  const authLoading = useAuthStore((s) => s.loading)
  const session     = useAuthStore((s) => s.session)
  const userId      = useAuthStore((s) => s.user?.id)
  const { hasProfile, loading: profileLoading } = useUserProfile()
  const [isBanned,     setIsBanned]     = useState(false)
  const [banChecked,   setBanChecked]   = useState(false)
  const [showWelcome,  setShowWelcome]  = useState(false)

  // Verificar ban al autenticar
  useEffect(() => {
    if (!userId) { setBanChecked(true); return }
    checkIsBanned(userId).then((banned) => {
      setIsBanned(banned)
      setBanChecked(true)
      // Mostrar tutorial de bienvenida solo si no lo ha visto
      if (!banned) setShowWelcome(!hasSeenWelcome())
    })
  }, [userId])

  if (authLoading || (session && (profileLoading || !banChecked))) return <LoadingScreen />
  if (!session) return <LoginScreen />
  if (isBanned) return <BannedScreen />
  if (!hasProfile) return <OnboardingFlow />

  return (
    <>
      <Routes>
        {/* Ruta pública de importación — sin AppShell */}
        <Route path="/import" element={<ImportRoutineScreen />} />

        {/* Rutas con chrome (Header + BottomNav) */}
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/routines"  element={<RoutinesTab />} />
          <Route path="/session"   element={<SessionTab />} />
          <Route path="/exercises" element={<CatalogScreen />} />
          <Route path="/settings"  element={<SettingsScreen />} />
          <Route path="/history"   element={<HistoryRoute />} />
          <Route path="/records"   element={<RecordsRoute />} />
          <Route path="/ai"        element={<AIChatRoute />} />
          <Route path="/admin"     element={<AdminScreen />} />
        </Route>
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Tutorial de bienvenida — solo la primera vez por dispositivo */}
      {showWelcome && (
        <WelcomeVideoModal onClose={() => setShowWelcome(false)} />
      )}
    </>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthenticatedApp />
        <ToastContainer />
      </AuthProvider>
    </ThemeProvider>
  )
}
