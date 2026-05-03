/* ============================================================
   BottomNav.tsx — Navegación inferior principal
   Responsabilidad: renderiza 5 tabs; la ruta activa se lee
   de React Router (useLocation) — sin estado local.
   ============================================================ */
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Play,
  BookOpen,
  Settings,
} from 'lucide-react'
import './BottomNav.css'

const NAV_ITEMS = [
  { id: 'dashboard', path: '/dashboard', label: 'Inicio',     icon: LayoutDashboard },
  { id: 'routines',  path: '/routines',  label: 'Rutinas',    icon: ClipboardList   },
  { id: 'session',   path: '/session',   label: 'Entrenar',   icon: Play            },
  { id: 'exercises', path: '/exercises', label: 'Ejercicios', icon: BookOpen        },
  { id: 'settings',  path: '/settings',  label: 'Ajustes',    icon: Settings        },
] as const

export type TabId = (typeof NAV_ITEMS)[number]['id']

type BottomNavProps = {
  /** Interceptor opcional: permite al padre bloquear la navegación (sesión activa) */
  onTabChange?: (tabId: TabId) => void
}

export function BottomNav({ onTabChange }: BottomNavProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const activeIndex = NAV_ITEMS.findIndex((item) =>
    location.pathname.startsWith(item.path),
  )

  function handleItemClick(item: (typeof NAV_ITEMS)[number]) {
    if (onTabChange) {
      onTabChange(item.id)
    } else {
      navigate(item.path)
    }
  }

  return (
    <nav className="bottom-nav" aria-label="Navegacion principal">
      <div className="bottom-nav__indicator-track">
        <span
          className="bottom-nav__indicator"
          style={{ '--tab-index': activeIndex } as React.CSSProperties}
        />
      </div>

      <div className="bottom-nav__items">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)
          return (
            <button
              key={item.id}
              className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
              onClick={() => handleItemClick(item)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <Icon
                size={22}
                className="bottom-nav__icon"
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span className="bottom-nav__label">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
