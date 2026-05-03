/* ============================================================
   Header.tsx — Cabecera fija de la app
   Responsabilidad: Avatar + saludo + accesos rapidos.
   Añade corona de admin solo visible al super-admin.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useNavigate } from 'react-router-dom'
import { History, Trophy, User, Sparkles, Crown } from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { useProfileStore } from '../../stores/profileStore'
import { useAIButtonEffect } from '../../features/ai/hooks/useAIButtonEffect'
import { useIsAdmin } from '../../utils/useIsAdmin'
import './Header.css'

export function Header() {
  const navigate       = useNavigate()
  const profile        = useProfileStore((s) => s.profile)
  const { rainbowEnabled } = useAIButtonEffect()
  const isAdmin        = useIsAdmin()

  return (
    <header className="header">
      <div className="header__inner">
        <div className="header__brand">
          {profile?.avatar_url ? (
            <div className="header__avatar-wrap">
              <img src={profile.avatar_url} alt="Avatar" className="header__avatar" />
            </div>
          ) : (
            <div className="header__avatar-wrap">
              <User size={18} className="header__avatar-icon" />
            </div>
          )}
          <span className="header__title">
            Bienvenidx, {profile?.full_name?.split(' ')[0] || 'Atleta'}!
          </span>
        </div>

        <div className="header__actions" style={{ display: 'flex', gap: '4px' }}>
          {/* Corona de admin — solo visible al super-admin */}
          {isAdmin && (
            <button
              className="header__crown-btn"
              onClick={() => navigate('/admin')}
              aria-label="Panel de administrador"
              title="Panel Admin"
            >
              <Crown size={16} />
            </button>
          )}

          <div className={`header__ai-btn-wrap${rainbowEnabled ? ' header__ai-btn-wrap--rainbow' : ''}`}>
            <IconButton
              icon={Sparkles}
              size="sm"
              variant="ghost"
              ariaLabel="Chat con entrenador IA"
              onClick={() => navigate('/ai')}
            />
          </div>
          <IconButton
            icon={Trophy}
            size="sm"
            variant="ghost"
            ariaLabel="Ver récords personales"
            onClick={() => navigate('/records')}
          />
          <IconButton
            icon={History}
            size="sm"
            variant="ghost"
            ariaLabel="Ver historial de sesiones"
            onClick={() => navigate('/history')}
          />
        </div>
      </div>
    </header>
  )
}
