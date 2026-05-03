/* ============================================================
   AdminScreen.tsx — Pantalla de administracion con tabs
   FASE 06 — GYM-YJMG
   BUG FIX: UserDetailPanel ahora se renderiza fuera del
   scroll container para evitar el problema del stacking context.
   Limite: 150 lineas — SKILL-CODE §2.4
   ============================================================ */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Gift, Crown, Video } from 'lucide-react'
import { useIsAdmin, useIsSuperAdmin } from '../../utils/useIsAdmin'
import { UsersTab } from './UsersTab'
import { BonusTab } from './BonusTab'
import { VideosTab } from './VideosTab'
import { UserDetailPanel } from './UserDetailPanel'
import { useAuthStore } from '../../stores/authStore'
import type { AdminUser } from '../../services/admin.service'
import './AdminScreen.css'

type TabId = 'users' | 'bonus' | 'videos'

export function AdminScreen() {
  const navigate      = useNavigate()
  const isAdmin       = useIsAdmin()
  const isSuperAdmin  = useIsSuperAdmin()
  const currentUserId = useAuthStore((s) => s.user?.id ?? '')

  const [activeTab,    setActiveTab]    = useState<TabId>(isSuperAdmin ? 'users' : 'bonus')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  useEffect(() => {
    if (!isAdmin) navigate('/dashboard', { replace: true })
  }, [isAdmin, navigate])

  if (!isAdmin) return null

  return (
    /* el div raiz cubre toda la pantalla y esta por encima del BottomNav */
    <div className="admin-screen">
      {/* ── Header ── */}
      <div className="admin-screen__header">
        <button className="admin-screen__back" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft size={20} />
        </button>

        <div className="admin-screen__title-row">
          <Crown size={16} className={`admin-screen__crown ${isSuperAdmin ? 'admin-screen__crown--super' : ''}`} />
          <h1 className="admin-screen__title">
            {isSuperAdmin ? 'Super Admin' : 'Panel Admin'}
          </h1>
        </div>

        <div className="admin-screen__header-end">
          {isSuperAdmin
            ? <span className="admin-screen__badge admin-screen__badge--super">SUPER</span>
            : <span className="admin-screen__badge admin-screen__badge--admin">ADMIN</span>
          }
        </div>
      </div>

      {/* ── Tabs ── */}
      {isSuperAdmin && (
        <div className="admin-screen__tabs" role="tablist">
          <button
            className={`admin-screen__tab ${activeTab === 'users' ? 'admin-screen__tab--active' : ''}`}
            onClick={() => setActiveTab('users')}
            role="tab" aria-selected={activeTab === 'users'}
          >
            <Users size={14} /> Usuarios
          </button>
          <button
            className={`admin-screen__tab ${activeTab === 'bonus' ? 'admin-screen__tab--active' : ''}`}
            onClick={() => setActiveTab('bonus')}
            role="tab" aria-selected={activeTab === 'bonus'}
          >
            <Gift size={14} /> Ejercicios Bonus
          </button>
          <button
            className={`admin-screen__tab ${activeTab === 'videos' ? 'admin-screen__tab--active' : ''}`}
            onClick={() => setActiveTab('videos')}
            role="tab" aria-selected={activeTab === 'videos'}
          >
            <Video size={14} /> Videos
          </button>
        </div>
      )}

      {/* ── Contenido scrollable ── */}
      <div className="admin-screen__content">
        {activeTab === 'users'  && isSuperAdmin && (
          <UsersTab onSelectUser={setSelectedUser} />
        )}
        {activeTab === 'bonus'  && <BonusTab canEdit={isSuperAdmin} />}
        {activeTab === 'videos' && isSuperAdmin && <VideosTab />}
      </div>

      {/* ── UserDetailPanel fuera del scroll container (evita stacking context bug) ── */}
      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          currentUserId={currentUserId}
          onClose={() => setSelectedUser(null)}
          onChanged={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}
