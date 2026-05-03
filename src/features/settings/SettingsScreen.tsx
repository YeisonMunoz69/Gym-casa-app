/* ============================================================
   SettingsScreen.tsx — Pantalla de Ajustes
   FASE 05 — GYM-YJMG
   Responsabilidad: Configuración del usuario + logout.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useState } from 'react'
import { LogOut, Settings2, AlertCircle, Gift } from 'lucide-react'
import { logoutUser } from '../../services/auth.service'
import { showToast } from '../../components/ui/Toast'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Button } from '../../components/ui/Button'
import { HamsterLoader } from '../../components/ui/HamsterLoader'
import { ProfileScreen } from '../profile/components/ProfileScreen'
// RestTimerClock — comentado, pendiente de uso futuro
// import { RestTimerClock } from './components/RestTimerClock'
import { useSettings } from './hooks/useSettings'
import { useQuoteVisibility } from '../dashboard/hooks/useQuoteVisibility'
import { useChestEnabled } from '../session/hooks/useChestEnabled'
import { useAIButtonEffect } from '../ai/hooks/useAIButtonEffect'
import { useHelpAnimation } from '../../components/ui/HelpVideo/hooks/useHelpAnimation'
import { useProfileStore } from '../../stores/profileStore'
import { PublicProfileEditor } from './components/PublicProfileEditor'
import './SettingsScreen.css'

export function SettingsScreen() {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { loading, settings, updateSettings } = useSettings()
  const { showQuote, setShowQuote } = useQuoteVisibility()
  const { chestEnabled, setChestEnabled } = useChestEnabled()
  const { rainbowEnabled, setRainbowEnabled } = useAIButtonEffect()
  const { helpAnimationsEnabled, setHelpAnimationsEnabled } = useHelpAnimation()
  const profile = useProfileStore((s) => s.profile)

  const isProfileIncomplete = !profile?.full_name && !profile?.goal

  async function handleLogout() {
    setShowLogoutConfirm(false)
    setLoggingOut(true)
    const { error } = await logoutUser()
    if (error) {
      showToast('Error al cerrar sesión', 'error')
      setLoggingOut(false)
    }
  }

  // handleRestTimerChange — comentado junto con RestTimerClock
  // async function handleRestTimerChange(value: number) {
  //   await updateSettings({ default_rest_seconds: value })
  // }

  if (loading) {
    return (
      <div className="settings-screen settings-screen--loading">
        <HamsterLoader />
      </div>
    )
  }

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <Settings2 size={22} className="settings-header__icon" aria-hidden="true" />
        <h1 className="settings-header__title">Ajustes</h1>
      </div>

      {/* Banner de perfil incompleto (si omitió el onboarding) */}
      {isProfileIncomplete && (
        <div className="settings-pending-banner">
          <AlertCircle size={16} className="settings-pending-banner__icon" />
          <div className="settings-pending-banner__text">
            <p className="settings-pending-banner__title">Perfil pendiente</p>
            <p className="settings-pending-banner__desc">Completa tu información para personalizar tu experiencia</p>
          </div>
        </div>
      )}

      {/* ── Perfil de usuario ── */}
      <div className="settings-profile-section">
        <ProfileScreen />
        <PublicProfileEditor />
      </div>

      {/* ── Preferencias de entrenamiento ── (pendiente: reloj de descanso por defecto)
      <section className="settings-section">
        <p className="settings-section__label">Entrenamiento</p>
        <RestTimerClock
          value={settings?.default_rest_seconds ?? 90}
          saving={saving}
          onChange={handleRestTimerChange}
        />
      </section>
      */}

      {/* ── Preferencias ── */}
      <section className="settings-section">
        <p className="settings-section__label">Preferencias</p>

        {/* Toggle: Frase del día */}
        <div className="settings-toggle-row">
          <span className="settings-toggle-row__label">Frase del día en Inicio</span>
          <div className="settings-toggle-row__control">
            <span className="settings-toggle-row__state" data-active={showQuote}>
              {showQuote ? 'Visible' : 'Oculta'}
            </span>
            <input className="profile-switch__input" id="quote-switch" type="checkbox"
              checked={showQuote} onChange={(e) => setShowQuote(e.target.checked)} />
            <label className="profile-switch" htmlFor="quote-switch" aria-label="Toggle Frase del día">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="slider">
                <path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V256c0 17.7 14.3 32 32 32s32-14.3 32-32V32zM143.5 120.6c13.6-11.3 15.4-31.5 4.1-45.1s-31.5-15.4-45.1-4.1C49.7 115.4 16 181.8 16 256c0 132.5 107.5 240 240 240s240-107.5 240-240c0-74.2-33.8-140.6-86.6-184.6c-13.6-11.3-33.8-9.4-45.1 4.1s-9.4 33.8 4.1 45.1c38.9 32.3 63.5 81 63.5 135.4c0 97.2-78.8 176-176 176s-176-78.8-176-176c0-54.4 24.7-103.1 63.5-135.4z"></path>
              </svg>
            </label>
          </div>
        </div>

        {/* Toggle: Cofre de recompensa */}
        <div className="settings-toggle-row">
          <div className="settings-toggle-row__label-group">
            <span className="settings-toggle-row__label settings-toggle-row__label--gift">
              <Gift size={13} />
              Cofre de recompensa
            </span>
            <span className="settings-toggle-row__desc">
              Ejercicio bonus sorpresa al terminar cada sesión
            </span>
          </div>
          <div className="settings-toggle-row__control">
            <span className="settings-toggle-row__state" data-active={chestEnabled}>
              {chestEnabled ? 'Activo' : 'Inactivo'}
            </span>
            <input className="profile-switch__input" id="chest-switch" type="checkbox"
              checked={chestEnabled}
              onChange={(e) => setChestEnabled(e.target.checked)} />
            <label className="profile-switch" htmlFor="chest-switch" aria-label="Toggle Cofre de recompensa">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="slider">
                <path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V256c0 17.7 14.3 32 32 32s32-14.3 32-32V32zM143.5 120.6c13.6-11.3 15.4-31.5 4.1-45.1s-31.5-15.4-45.1-4.1C49.7 115.4 16 181.8 16 256c0 132.5 107.5 240 240 240s240-107.5 240-240c0-74.2-33.8-140.6-86.6-184.6c-13.6-11.3-33.8-9.4-45.1 4.1s-9.4 33.8 4.1 45.1c38.9 32.3 63.5 81 63.5 135.4c0 97.2-78.8 176-176 176s-176-78.8-176-176c0-54.4 24.7-103.1 63.5-135.4z"></path>
              </svg>
            </label>
          </div>
        </div>

        {/* Toggle: Efecto arcoiris del boton IA */}
        <div className="settings-toggle-row">
          <div className="settings-toggle-row__label-group">
            <span className="settings-toggle-row__label">
              Botón IA interactivo
            </span>
            <span className="settings-toggle-row__desc">
              Anillo animado en el acceso al entrenador IA
            </span>
          </div>
          <div className="settings-toggle-row__control">
            <span className="settings-toggle-row__state" data-active={rainbowEnabled}>
              {rainbowEnabled ? 'Activo' : 'Oculto'}
            </span>
            <input className="profile-switch__input" id="ai-btn-switch" type="checkbox"
              checked={rainbowEnabled}
              onChange={(e) => setRainbowEnabled(e.target.checked)} />
            <label className="profile-switch" htmlFor="ai-btn-switch" aria-label="Toggle IA Button Effect">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="slider">
                <path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V256c0 17.7 14.3 32 32 32s32-14.3 32-32V32zM143.5 120.6c13.6-11.3 15.4-31.5 4.1-45.1s-31.5-15.4-45.1-4.1C49.7 115.4 16 181.8 16 256c0 132.5 107.5 240 240 240s240-107.5 240-240c0-74.2-33.8-140.6-86.6-184.6c-13.6-11.3-33.8-9.4-45.1 4.1s-9.4 33.8 4.1 45.1c38.9 32.3 63.5 81 63.5 135.4c0 97.2-78.8 176-176 176s-176-78.8-176-176c0-54.4 24.7-103.1 63.5-135.4z"></path>
              </svg>
            </label>
          </div>
        </div>

        {/* Toggle: Animaciones de tutoriales */}
        <div className="settings-toggle-row">
          <div className="settings-toggle-row__label-group">
            <span className="settings-toggle-row__label">
              Animación de Tutoriales
            </span>
            <span className="settings-toggle-row__desc">
              Resplandor en los botones de ayuda de YouTube
            </span>
          </div>
          <div className="settings-toggle-row__control">
            <span className="settings-toggle-row__state" data-active={helpAnimationsEnabled}>
              {helpAnimationsEnabled ? 'Activa' : 'Oculta'}
            </span>
            <input className="profile-switch__input" id="help-anim-switch" type="checkbox"
              checked={helpAnimationsEnabled}
              onChange={(e) => setHelpAnimationsEnabled(e.target.checked)} />
            <label className="profile-switch" htmlFor="help-anim-switch" aria-label="Toggle Help Animation Effect">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="slider">
                <path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V256c0 17.7 14.3 32 32 32s32-14.3 32-32V32zM143.5 120.6c13.6-11.3 15.4-31.5 4.1-45.1s-31.5-15.4-45.1-4.1C49.7 115.4 16 181.8 16 256c0 132.5 107.5 240 240 240s240-107.5 240-240c0-74.2-33.8-140.6-86.6-184.6c-13.6-11.3-33.8-9.4-45.1 4.1s-9.4 33.8 4.1 45.1c38.9 32.3 63.5 81 63.5 135.4c0 97.2-78.8 176-176 176s-176-78.8-176-176c0-54.4 24.7-103.1 63.5-135.4z"></path>
              </svg>
            </label>
          </div>
        </div>

        {/* Toggle: Unidad de Peso */}
        <div className="settings-toggle-row">
          <span className="settings-toggle-row__label">
            Unidad de medida
          </span>
          <div className="settings-toggle-row__control" style={{ gap: 'var(--space-2)' }}>
            <button
              className={`settings-unit-btn ${settings?.unit_system !== 'imperial' ? 'active' : ''}`}
              onClick={() => updateSettings({ unit_system: 'metric' })}
            >
              Kg
            </button>
            <button
              className={`settings-unit-btn ${settings?.unit_system === 'imperial' ? 'active' : ''}`}
              onClick={() => updateSettings({ unit_system: 'imperial' })}
            >
              Lb
            </button>
          </div>
        </div>
      </section>

      {/* ── Contacto Desarrollador ── */}
      <section className="settings-section" style={{ marginTop: 'var(--space-4)' }}>
        <p className="settings-section__label" style={{ textAlign: 'center' }}>Contacto del Desarrollador YJMG</p>
        <div className="dev-contact-container">
          <div className="dev-main">
            <div className="dev-up">
              <a href="https://wa.me/3126910753" target="_blank" rel="noreferrer" className="dev-card1">
                <svg className="dev-whatsapp" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="30" width="30">
                  <path d="M19.001 4.908A9.817 9.817 0 0 0 11.992 2C6.534 2 2.085 6.448 2.08 11.908c0 1.748.458 3.45 1.321 4.956L2 22l5.255-1.377a9.916 9.916 0 0 0 4.737 1.206h.005c5.46 0 9.908-4.448 9.913-9.913A9.872 9.872 0 0 0 19 4.908h.001ZM11.992 20.15A8.216 8.216 0 0 1 7.797 19l-.3-.18-3.117.818.833-3.041-.196-.314a8.2 8.2 0 0 1-1.258-4.381c0-4.533 3.696-8.23 8.239-8.23a8.2 8.2 0 0 1 5.825 2.413 8.196 8.196 0 0 1 2.41 5.825c-.006 4.55-3.702 8.24-8.24 8.24Zm4.52-6.167c-.247-.124-1.463-.723-1.692-.808-.228-.08-.394-.123-.556.124-.166.246-.641.808-.784.969-.143.166-.29.185-.537.062-.247-.125-1.045-.385-1.99-1.23-.738-.657-1.232-1.47-1.38-1.716-.142-.247-.013-.38.11-.504.11-.11.247-.29.37-.432.126-.143.167-.248.248-.413.082-.167.043-.31-.018-.433-.063-.124-.557-1.345-.765-1.838-.2-.486-.404-.419-.557-.425-.142-.009-.309-.009-.475-.009a.911.911 0 0 0-.661.31c-.228.247-.864.845-.864 2.067 0 1.22.888 2.395 1.013 2.56.122.167 1.742 2.666 4.229 3.74.587.257 1.05.408 1.41.523.595.19 1.13.162 1.558.1.475-.072 1.464-.6 1.673-1.178.205-.58.205-1.075.142-1.18-.061-.104-.227-.165-.475-.29Z"></path>
                </svg>
              </a>
              <a href="https://www.linkedin.com/in/yeison-munozz-pro/" target="_blank" rel="noreferrer" className="dev-card2">
                <svg xmlns="http://www.w3.org/2000/svg" className="dev-linkedin" height="1.6em" viewBox="0 0 448 512">
                  <path d="M100.3 448H7.4V148.9h92.9zM53.8 108.1C24.1 108.1 0 83.5 0 53.8a53.8 53.8 0 0 1 107.6 0c0 29.7-24.1 54.3-53.8 54.3zM447.9 448h-92.7V302.4c0-34.7-.7-79.2-48.3-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.8V148.9h89.1v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3V448z"></path>
                </svg>
              </a>
            </div>
            <div className="dev-down">
              <a href="https://github.com/YeisonMunoz69" target="_blank" rel="noreferrer" className="dev-card3">
                <svg className="dev-github" height="30px" width="30px" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15,3C8.373,3,3,8.373,3,15c0,5.623,3.872,10.328,9.092,11.63C12.036,26.468,12,26.28,12,26.047v-2.051 c-0.487,0-1.303,0-1.508,0c-0.821,0-1.551-0.353-1.905-1.009c-0.393-0.729-0.461-1.844-1.435-2.526 c-0.289-0.227-0.069-0.486,0.264-0.451c0.615,0.174,1.125,0.596,1.605,1.222c0.478,0.627,0.703,0.769,1.596,0.769 c0.433,0,1.081-0.025,1.691-0.121c0.328-0.833,0.895-1.6,1.588-1.962c-3.996-0.411-5.903-2.399-5.903-5.098 c0-1.162,0.495-2.286,1.336-3.233C9.053,10.647,8.706,8.73,9.435,8c1.798,0,2.885,1.166,3.146,1.481C13.477,9.174,14.461,9,15.495,9 c1.036,0,2.024,0.174,2.922,0.483C18.675,9.17,19.763,8,21.565,8c0.732,0.731,0.381,2.656,0.102,3.594 c0.836,0.945,1.328,2.066,1.328,3.226c0,2.697-1.904,4.684-5.894,5.097C18.199,20.49,19,22.1,19,23.313v2.734 c0,0.104-0.023,0.179-0.035,0.268C23.641,24.676,27,20.236,27,15C27,8.373,21.627,3,15,3z"></path>
                </svg>
              </a>
              <a href="mailto:yjmunoz@unimayor.edu.co" className="dev-card4">
                <svg className="dev-gmail" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30px" height="30px">
                  <path d="M20,4H4C2.895,4,2,4.895,2,6v12c0,1.105,0.895,2,2,2h16c1.105,0,2-0.895,2-2V6C22,4.895,21.105,4,20,4z M20,8.236l-8,5.333 L4,8.236V6l8,5.333L20,6V8.236z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Zona de logout ── */}
      <div className="settings-danger-zone">
        <p className="settings-danger-zone__label">Cuenta</p>
        <Button
          variant="danger"
          fullWidth
          loading={loggingOut}
          cyber
          onClick={() => setShowLogoutConfirm(true)}
        >
          <LogOut size={16} />
          Cerrar Sesión
        </Button>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Cerrar Sesión"
        message="¿Estás seguro que deseas cerrar tu sesión en la aplicación?"
        confirmLabel="Salir"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  )
}
