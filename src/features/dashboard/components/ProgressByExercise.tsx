/* ============================================================
   ProgressByExercise.tsx — Progresión de peso por ejercicio
   FASE 04 — GYM-YJMG
   Responsabilidad: Selector de ejercicio + gráfica de línea (peso/volumen)
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { TrendingUp, ChevronDown } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useProgressByExercise } from '../hooks/useProgressByExercise'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import type { ProgressPoint } from '../../../services/progress.service'
import './ProgressByExercise.css'

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()}/${d.getMonth() + 1}`
}

type CustomTooltipProps = {
  active?: boolean
  payload?: { payload: ProgressPoint; value: number; name: string; color: string }[]
  label?: string
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload

  return (
    <div className="pbe-tooltip">
      <span className="pbe-tooltip__date">{p.date}</span>
      <span className="pbe-tooltip__row">
        Peso máx: <strong>{p.maxWeight} kg</strong>
      </span>
      <span className="pbe-tooltip__row">
        Volumen: <strong>{p.totalVolume} kg</strong>
      </span>
    </div>
  )
}

function EmptyProgress() {
  return (
    <div className="pbe-empty">
      <TrendingUp size={40} strokeWidth={1.5} />
      <p className="pbe-empty__text">Sin datos para este ejercicio</p>
      <span className="pbe-empty__hint">Completa sesiones para ver tu progresión</span>
    </div>
  )
}

export function ProgressByExercise() {
  const {
    exercises, selectedId, setSelectedId,
    progress, loadingList, loadingProgress, error,
  } = useProgressByExercise()

  const isLoading = loadingList || loadingProgress

  return (
    <section className="pbe-section">
      <div className="pbe-header">
        <TrendingUp size={18} className="pbe-header__icon" aria-hidden="true" />
        <h2 className="pbe-header__title">Progresión por Ejercicio</h2>
      </div>

      {/* Selector de ejercicio */}
      {!loadingList && exercises.length > 0 && (
        <div className="pbe-select-wrap">
          <select
            className="pbe-select"
            value={selectedId ?? ''}
            onChange={e => setSelectedId(e.target.value)}
            aria-label="Seleccionar ejercicio"
          >
            {exercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pbe-select-wrap__icon" aria-hidden="true" />
        </div>
      )}

      {/* Estado de carga */}
      {isLoading && (
        <div className="pbe-loading">
          <HamsterLoader size={60} />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <p className="pbe-error">{error}</p>
      )}

      {/* Sin datos */}
      {!isLoading && !error && exercises.length === 0 && <EmptyProgress />}

      {/* Gráfica */}
      {!isLoading && !error && progress.length > 0 && (
        <div className="pbe-chart">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={progress} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="pbe-line-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="var(--color-accent-cyan)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(0,0%,100%,0.06)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="maxWeight"
                stroke="url(#pbe-line-gradient)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: 'var(--color-accent-cyan)' }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="pbe-chart__label">Peso máximo por sesión (kg)</p>
        </div>
      )}

      {/* Sin sesiones pero con ejercicio seleccionado */}
      {!isLoading && !error && exercises.length > 0 && progress.length === 0 && <EmptyProgress />}
    </section>
  )
}
