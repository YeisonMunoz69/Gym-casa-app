/* ============================================================
   HistoryScreen.tsx — Subpantalla completa de historial
   FASE 04 — GYM-YJMG
   Responsabilidad: Lista de sesiones + navegación a detalle.
   Se abre desde el icono del Header.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useState } from 'react'
import { ArrowLeft, CalendarDays, Clock, Layers, ChevronRight } from 'lucide-react'
import { useSessionHistory } from '../hooks/useSessionHistory'
import { SessionDetailScreen } from './SessionDetailScreen'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import type { HistoryFilter, SessionHistoryRow } from '../../../services/history.service'
import './HistoryScreen.css'

type SelectedSession = { id: string; label: string; date: string }

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
}

type FilterTabProps = { label: string; active: boolean; onClick: () => void }
function FilterTab({ label, active, onClick }: FilterTabProps) {
  return (
    <button
      className={`hs-filter__tab${active ? ' hs-filter__tab--active' : ''}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

type SessionRowProps = { session: SessionHistoryRow; onSelect: () => void }
function SessionRow({ session, onSelect }: SessionRowProps) {
  return (
    <li className="hs-row" onClick={onSelect} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect()}
      aria-label={`Ver detalle de ${session.day_label}`}
    >
      <div className="hs-row__left">
        <CalendarDays size={16} className="hs-row__icon" aria-hidden="true" />
        <div className="hs-row__info">
          <span className="hs-row__label">{session.day_label}</span>
          <span className="hs-row__date">{formatDate(session.session_date)}</span>
        </div>
      </div>
      <div className="hs-row__right">
        <span className="hs-row__stat"><Clock size={12} />{formatDuration(session.duration_seconds)}</span>
        <span className="hs-row__stat"><Layers size={12} />{session.total_sets} sets</span>
        <ChevronRight size={14} className="hs-row__chevron" />
      </div>
    </li>
  )
}

function EmptyHistory() {
  return (
    <div className="hs-empty">
      <CalendarDays size={48} strokeWidth={1.5} />
      <p className="hs-empty__text">Sin sesiones en este período</p>
      <span className="hs-empty__hint">Completa una sesión para verla aquí</span>
    </div>
  )
}

type Props = { onClose: () => void }

export function HistoryScreen({ onClose }: Props) {
  const [filter, setFilter] = useState<HistoryFilter>('week')
  const [selected, setSelected] = useState<SelectedSession | null>(null)
  const { sessions, loading, error } = useSessionHistory(filter)

  // Sub-pantalla de detalle
  if (selected) {
    return (
      <SessionDetailScreen
        sessionId={selected.id}
        sessionLabel={selected.label}
        sessionDate={selected.date}
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <div className="hs-screen">
      <div className="hs-header">
        <button className="hs-header__back" onClick={onClose} aria-label="Cerrar historial">
          <ArrowLeft size={20} />
        </button>
        <h1 className="hs-header__title">Historial</h1>
        <div className="hs-filter" role="group" aria-label="Filtrar historial">
          <FilterTab label="7 días" active={filter === 'week'} onClick={() => setFilter('week')} />
          <FilterTab label="30 días" active={filter === 'month'} onClick={() => setFilter('month')} />
        </div>
      </div>

      {loading && (
        <div className="loading-fullscreen">
          <HamsterLoader size={80} />
          <span className="loading-fullscreen__label">Cargando historial...</span>
        </div>
      )}
      {!loading && error && <p className="hs-error">{error}</p>}
      {!loading && !error && sessions.length === 0 && <EmptyHistory />}
      {!loading && !error && sessions.length > 0 && (
        <ul className="hs-list">
          {sessions.map(s => (
            <SessionRow
              key={s.id}
              session={s}
              onSelect={() => setSelected({ id: s.id, label: s.day_label, date: s.session_date })}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
