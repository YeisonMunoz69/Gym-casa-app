import {
  LayoutDashboard,
  ClipboardList,
  Play,
  BookOpen,
  Settings,
} from 'lucide-react'
import './TabPlaceholder.css'

type TabPlaceholderProps = {
  tabId: string
  title: string
}

const TAB_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  routines: ClipboardList,
  session: Play,
  exercises: BookOpen,
  settings: Settings,
}

export function TabPlaceholder({ tabId, title }: TabPlaceholderProps) {
  const Icon = TAB_ICONS[tabId] ?? LayoutDashboard

  return (
    <div className="tab-placeholder">
      <div className="tab-placeholder__icon-ring">
        <Icon size={40} strokeWidth={1.5} />
      </div>
      <h2 className="tab-placeholder__title">{title}</h2>
      <p className="tab-placeholder__subtitle">Proximamente</p>
    </div>
  )
}
