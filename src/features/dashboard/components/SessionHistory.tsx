/* ============================================================
   SessionHistory.tsx — Historial de sesiones con filtro semana/mes
   FASE 04 — GYM-YJMG
   Responsabilidad: Mostrar sesiones completadas paginadas.
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useState } from 'react'
import { CalendarDays, Clock, Layers, ChevronRight } from 'lucide-react'
import { useSessionHistory } from '../hooks/useSessionHistory'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import type { HistoryFilter } from '../../../services/history.service'
import './SessionHistory.css'

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

type FilterTabProps = {
  label: string
  active: boolean
  onClick: () => void
}

function FilterTab({ label, active, onClick }: FilterTabProps) {
  return (
    <button
      className={`sh-filter__tab${active ? ' sh-filter__tab--active' : ''}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

type SessionRowProps = {
  dayLabel: string
  date: string
  duration: number | null
  totalSets: number
}

function SessionRow({ dayLabel, date, duration, totalSets }: SessionRowProps) {
  return (
    <li className="sh-row">
      <div className="sh-row__left">
        <CalendarDays size={16} className="sh-row__icon" aria-hidden="true" />
        <div className="sh-row__info">
          <span className="sh-row__label">{dayLabel}</span>
          <span className="sh-row__date">{formatDate(date)}</span>
        </div>
      </div>
      <div className="sh-row__right">
        <span className="sh-row__stat" title="Duración">
          <Clock size={12} aria-hidden="true" />
          {formatDuration(duration)}
        </span>
        <span className="sh-row__stat" title="Sets completados">
          <Layers size={12} aria-hidden="true" />
          {totalSets} sets
        </span>
        <ChevronRight size={14} className="sh-row__chevron" aria-hidden="true" />
      </div>
    </li>
  )
}

function EmptyHistory() {
  return (
    <div className="sh-empty">
      <CalendarDays size={40} strokeWidth={1.5} />
      <p className="sh-empty__text">Sin sesiones en este período</p>
      <span className="sh-empty__hint">Completa una sesión para verla aquí</span>
    </div>
  )
}

export function SessionHistory() {
  const [filter, setFilter] = useState<HistoryFilter>('week')
  const { sessions, loading, error } = useSessionHistory(filter)

  return (
    <section className="sh-section">
      <div className="sh-header">
        <h2 className="sh-header__title">Historial</h2>
        <div className="sh-filter" role="group" aria-label="Filtrar historial">
          <FilterTab label="7 días" active={filter === 'week'} onClick={() => setFilter('week')} />
          <FilterTab label="30 días" active={filter === 'month'} onClick={() => setFilter('month')} />
        </div>
      </div>

      {loading && (
        <div className="sh-loading">
          <HamsterLoader size={60} />
        </div>
      )}

      {!loading && error && (
        <p className="sh-error">{error}</p>
      )}

      {!loading && !error && sessions.length === 0 && <EmptyHistory />}

      {!loading && !error && sessions.length > 0 && (
        <ul className="sh-list">
          {sessions.map(s => (
            <SessionRow
              key={s.id}
              dayLabel={s.day_label}
              date={s.session_date}
              duration={s.duration_seconds}
              totalSets={s.total_sets}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
