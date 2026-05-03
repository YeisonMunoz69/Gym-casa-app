/* ============================================================
   Header.tsx — Cabecera fija de la app
   Responsabilidad: Avatar + saludo + accesos rapidos.
   Añade corona de admin solo visible al super-admin.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { History, Trophy, User, Sparkles, Crown } from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { useProfileStore } from '../../stores/profileStore'
import { useAuthStore } from '../../stores/authStore'
import { useAIButtonEffect } from '../../features/ai/hooks/useAIButtonEffect'
import { useIsAdmin } from '../../utils/useIsAdmin'
import { supabase } from '../../services/supabase'
import './Header.css'

export function Header() {
  const navigate           = useNavigate()
  const profile            = useProfileStore((s) => s.profile)
  const userId             = useAuthStore((s) => s.user?.id)
  const { rainbowEnabled } = useAIButtonEffect()
  const isAdmin            = useIsAdmin()
  const [displayName, setDisplayName] = useState<string | null>(null)

  // Cargar display_name desde la tabla pública profiles
  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        const name = (data as { display_name: string | null } | null)?.display_name
        setDisplayName(name ?? null)
      })
  }, [userId])

  // Saludo según género
  const greeting =
    profile?.gender === 'male'   ? 'Bienvenido' :
    profile?.gender === 'female' ? 'Bienvenida' :
    'Hola'

  // Nombre: display_name (elegido por el usuario) > primer nombre de registro > fallback
  const firstName =
    displayName ||
    profile?.full_name?.split(' ')[0] ||
    'Atleta'

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
            {greeting}, {firstName}!
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
