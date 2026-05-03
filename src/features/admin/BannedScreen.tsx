/* ============================================================
   BannedScreen.tsx — Pantalla mostrada a usuarios bloqueados
   FASE 06 — GYM-YJMG
   Se muestra en lugar de la app cuando is_banned = true.
   Limite: 60 lineas — SKILL-CODE §2.4
   ============================================================ */
import { Ban, LogOut } from 'lucide-react'
import { logoutUser } from '../../services/auth.service'
import './BannedScreen.css'

export function BannedScreen() {
  async function handleLogout() {
    await logoutUser()
  }

  return (
    <div className="banned-screen">
      <div className="banned-screen__card">
        <div className="banned-screen__icon-wrap">
          <Ban size={40} className="banned-screen__icon" />
        </div>

        <h1 className="banned-screen__title">Acceso Restringido</h1>
        <p className="banned-screen__desc">
          Tu acceso a Fitness Casa ha sido suspendido por el administrador.
          Si crees que esto es un error, contacta directamente al administrador.
        </p>

        <button className="banned-screen__logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          Cerrar sesion
        </button>
      </div>
    </div>
  )
}
