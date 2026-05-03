/* ============================================================
   UsersTab.tsx — Lista de usuarios (super-admin)
   FASE 06 — GYM-YJMG
   Click en usuario abre UserDetailPanel con stats y controles.
   Limite: 100 lineas — SKILL-CODE §2.4
   ============================================================ */
import { useState, useEffect, useCallback } from 'react'
import { User, Crown, WifiOff, Ban, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { getAllUsers } from '../../services/admin.service'
import { showToast } from '../../components/ui/Toast'
import type { AdminUser } from '../../services/admin.service'
import './UsersTab.css'

const ROLE_CLASS: Record<string, string> = {
  super_admin: 'users-tab__role--super',
  admin:       'users-tab__role--admin',
  user:        'users-tab__role--user',
}
const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  user:        'Usuario',
}

type Props = { onSelectUser: (user: AdminUser) => void }

export function UsersTab({ onSelectUser }: Props) {
  const currentUserId = useAuthStore((s) => s.user?.id ?? '')
  const [users,   setUsers]   = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getAllUsers()
    if (error) showToast('Error al cargar usuarios', 'error')
    else setUsers(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  if (loading) {
    return (
      <div className="users-tab__loading">
        <div className="users-tab__spinner" />
        <span>Cargando usuarios...</span>
      </div>
    )
  }

  return (
    <div className="users-tab">
      <p className="users-tab__count">{users.length} perfiles registrados</p>

      <div className="users-tab__list">
        {users.map((u) => {
          const isSelf = u.id === currentUserId

          return (
            <button
              key={u.id}
              className={`users-tab__item ${u.is_banned ? 'users-tab__item--banned' : !u.is_active ? 'users-tab__item--inactive' : ''}`}
              onClick={() => onSelectUser(u)}
              aria-label={`Ver detalle de ${u.display_name ?? 'usuario'}`}
            >
              <div className="users-tab__avatar">
                <User size={15} />
                {u.role === 'super_admin' && <Crown size={10} className="users-tab__crown-badge" />}
              </div>

              <div className="users-tab__info">
                <div className="users-tab__name-row">
                  <span className="users-tab__name">
                    {u.display_name ?? 'Sin nombre'}{isSelf ? ' (tú)' : ''}
                  </span>
                  {u.is_banned  && <Ban    size={11} className="users-tab__ban-icon"      />}
                  {!u.is_active && !u.is_banned && <WifiOff size={11} className="users-tab__inactive-icon" />}
                </div>
                <div className="users-tab__meta-row">
                  <span className="users-tab__household">{u.household_label}</span>
                  <span className={`users-tab__role ${ROLE_CLASS[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                </div>
              </div>

              <ChevronRight size={14} className="users-tab__chevron" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
