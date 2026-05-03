/* ============================================================
   UserDetailPanel.tsx — Panel de detalle de usuario (super-admin)
   FASE 06 — GYM-YJMG
   Fullscreen overlay con estadisticas y acciones de control.
   Limite: 150 lineas — SKILL-CODE §2.4
   ============================================================ */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, User, Shield, UserX, Ban, CheckCircle, Crown, WifiOff } from 'lucide-react'
import { useUserStats } from './hooks/useUserStats'
import { UserStatsGrid } from './UserStatsGrid'
import { setUserBanned, grantAdmin, revokeAdmin } from '../../services/admin.service'
import { showToast } from '../../components/ui/Toast'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import type { AdminUser } from '../../services/admin.service'
import './UserDetailPanel.css'

type Props = {
  user:        AdminUser
  currentUserId: string
  onClose:     () => void
  onChanged:   () => void
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  user:        'Usuario',
}

export function UserDetailPanel({ user, currentUserId, onClose, onChanged }: Props) {
  const { stats, loading } = useUserStats(user.id)
  const [busy,            setBusy]            = useState(false)
  const [confirmBan,      setConfirmBan]      = useState(false)
  const [confirmRoleAction, setConfirmRoleAction] = useState<'promote' | 'revoke' | null>(null)

  const isSelf  = user.id === currentUserId
  const isSuper = user.role === 'super_admin'
  const isAdmin = user.role === 'admin'

  async function handleBanToggle() {
    setBusy(true)
    const { error } = await setUserBanned(user.id, !user.is_banned)
    if (error) showToast('Error al actualizar', 'error')
    else {
      showToast(user.is_banned ? 'Usuario desbloqueado' : 'Usuario bloqueado', 'success')
      onChanged()
    }
    setBusy(false)
    setConfirmBan(false)
  }

  async function handleRoleAction() {
    if (!confirmRoleAction) return
    setBusy(true)
    const { error } = confirmRoleAction === 'promote'
      ? await grantAdmin(user.id, currentUserId)
      : await revokeAdmin(user.id)
    if (error) showToast('Error al cambiar rol', 'error')
    else {
      showToast(confirmRoleAction === 'promote' ? 'Admin asignado' : 'Rol revocado', 'success')
      onChanged()
    }
    setBusy(false)
    setConfirmRoleAction(null)
  }

  return createPortal(
    <div className="user-detail">
      {/* Header */}
      <div className="user-detail__header">
        <button className="user-detail__back" onClick={onClose} aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <h1 className="user-detail__title">Perfil de usuario</h1>
        <div className="user-detail__header-end" />
      </div>

      <div className="user-detail__scroll">
        {/* Hero del usuario */}
        <div className="user-detail__hero">
          <div className="user-detail__avatar">
            <User size={28} />
            {user.role === 'super_admin' && <Crown size={12} className="user-detail__crown" />}
          </div>
          <h2 className="user-detail__name">{user.display_name ?? 'Sin nombre'}</h2>
          <p className="user-detail__household">{user.household_label}</p>
          <div className="user-detail__badges">
            <span className={`user-detail__role-badge user-detail__role-badge--${user.role}`}>
              {ROLE_LABEL[user.role]}
            </span>
            {user.is_banned && (
              <span className="user-detail__status-badge user-detail__status-badge--banned">
                <Ban size={10} /> Bloqueado
              </span>
            )}
            {!user.is_active && !user.is_banned && (
              <span className="user-detail__status-badge user-detail__status-badge--inactive">
                <WifiOff size={10} /> Inactivo
              </span>
            )}
          </div>
        </div>

        {/* Estadisticas */}
        <section className="user-detail__section">
          <h3 className="user-detail__section-title">Estadisticas de entrenamiento</h3>
          <UserStatsGrid stats={stats ?? { totalSessions: 0, totalMinutes: 0, lastSessionDate: null, daysSinceLastSession: null, topMuscleGroup: null, currentStreak: 0 }} loading={loading} />
        </section>

        {/* Acciones (no disponibles para si mismo ni para super-admin) */}
        {!isSelf && !isSuper && (
          <section className="user-detail__section">
            <h3 className="user-detail__section-title">Control de acceso</h3>
            <div className="user-detail__actions">
              {/* Rol */}
              {isAdmin ? (
                <button className="user-detail__action-btn user-detail__action-btn--warn"
                  onClick={() => setConfirmRoleAction('revoke')} disabled={busy}>
                  <UserX size={16} />
                  <div className="user-detail__action-text">
                    <span className="user-detail__action-label">Revocar Admin</span>
                    <span className="user-detail__action-sub">Convertir en usuario normal</span>
                  </div>
                </button>
              ) : (
                <button className="user-detail__action-btn user-detail__action-btn--primary"
                  onClick={() => setConfirmRoleAction('promote')} disabled={busy}>
                  <Shield size={16} />
                  <div className="user-detail__action-text">
                    <span className="user-detail__action-label">Hacer Admin</span>
                    <span className="user-detail__action-sub">Permite agregar ejercicios bonus</span>
                  </div>
                </button>
              )}

              {/* Ban */}
              {user.is_banned ? (
                <button className="user-detail__action-btn user-detail__action-btn--success"
                  onClick={handleBanToggle} disabled={busy}>
                  <CheckCircle size={16} />
                  <div className="user-detail__action-text">
                    <span className="user-detail__action-label">Desbloquear acceso</span>
                    <span className="user-detail__action-sub">El usuario podra acceder nuevamente</span>
                  </div>
                </button>
              ) : (
                <button className="user-detail__action-btn user-detail__action-btn--danger"
                  onClick={() => setConfirmBan(true)} disabled={busy}>
                  <Ban size={16} />
                  <div className="user-detail__action-text">
                    <span className="user-detail__action-label">Bloquear usuario</span>
                    <span className="user-detail__action-sub">Se le negara el acceso a la app</span>
                  </div>
                </button>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Confirmaciones (SKILL-CODE §5.5) */}
      {confirmBan && (
        <ConfirmDialog
          isOpen={true}
          message={`Bloquear a "${user.display_name ?? 'este usuario'}"? No podra acceder a la app.`}
          confirmLabel="Bloquear"
          variant="danger"
          onConfirm={handleBanToggle}
          onCancel={() => setConfirmBan(false)}
        />
      )}
      {confirmRoleAction && (
        <ConfirmDialog
          isOpen={true}
          message={confirmRoleAction === 'promote'
            ? `Hacer Admin a "${user.display_name ?? 'este usuario'}"?`
            : `Revocar el rol Admin de "${user.display_name ?? 'este usuario'}"?`}
          confirmLabel={confirmRoleAction === 'promote' ? 'Confirmar' : 'Revocar'}
          variant={confirmRoleAction === 'revoke' ? 'danger' : 'primary'}
          onConfirm={handleRoleAction}
          onCancel={() => setConfirmRoleAction(null)}
        />
      )}
    </div>,
    document.body
  )
}
