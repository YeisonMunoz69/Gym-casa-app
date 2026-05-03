/* ============================================================
   WeeklyLoadRing.tsx — Anillo SVG de carga semanal
   FASE 04 / FASE 06 — GYM-YJMG
   Hitbox invisible añadido para mostrar InfoDialog al tocar el anillo.
   Sin emojis (SKILL-CODE §5.4).
   ============================================================ */
import { useState } from 'react'
import { TrendingUp, TrendingDown, Activity, Info } from 'lucide-react'
import { InfoDialog } from '../../../components/ui/InfoDialog'

export type WeeklyLoadRingProps = {
  weeklyLoad: number
}

export function WeeklyLoadRing({ weeklyLoad }: WeeklyLoadRingProps) {
  const [showInfo, setShowInfo] = useState(false)

  let ringColor = 'var(--color-success)'
  let ringSecondaryColor = 'var(--color-primary)'
  let statusText = 'Optima'
  let StatusIcon = TrendingUp

  if (weeklyLoad < 30) {
    ringColor = 'var(--color-error)'
    ringSecondaryColor = 'var(--color-error-glow)'
    statusText = 'Baja'
    StatusIcon = TrendingDown
  } else if (weeklyLoad < 70) {
    ringColor = 'var(--color-warning)'
    ringSecondaryColor = '#ffd000'
    statusText = 'Media'
    StatusIcon = Activity
  }

  return (
    <>
      <section className="dash-ring">
        {/* Hitbox invisible para abrir el dialog */}
        <button
          className="dash-ring__hitbox"
          onClick={() => setShowInfo(true)}
          aria-label="Ver como se calcula la carga semanal"
        >
          <div className="dash-ring__container">
            <div
              className="dash-ring__glow"
              style={{
                background: `radial-gradient(circle, ${ringColor} 0%, transparent 70%)`,
                opacity: 0.2,
              }}
            />
            <svg className="dash-ring__svg" viewBox="0 0 100 100">
              <circle
                className="dash-ring__track"
                cx="50" cy="50" r="45"
                fill="none" strokeWidth="3" strokeLinecap="round"
              />
            </svg>
            <svg className="dash-ring__svg" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={ringColor} />
                  <stop offset="100%" stopColor={ringSecondaryColor} />
                </linearGradient>
              </defs>
              <circle
                className="dash-ring__progress"
                cx="50" cy="50" r="45"
                fill="none" strokeWidth="4.5" strokeLinecap="round"
                style={{ '--target-offset': 282.7 - (282.7 * weeklyLoad) / 100 } as any}
              />
            </svg>

            <div className="dash-ring__content">
              <span className="dash-ring__label">CARGA SEMANAL</span>
              <div className="dash-ring__value-row">
                <span className="dash-ring__value">{weeklyLoad}</span>
                <span className="dash-ring__symbol">%</span>
              </div>
              <div
                className="dash-ring__badge"
                style={{
                  color: ringColor,
                  borderColor: `color-mix(in srgb, ${ringColor} 30%, transparent)`,
                  background: `color-mix(in srgb, ${ringColor} 10%, transparent)`,
                }}
              >
                <StatusIcon size={16} />
                {statusText}
              </div>
              <div className="dash-ring__info-hint">
                <Info size={11} />
                <span>Toca para saber mas</span>
              </div>
            </div>
          </div>
        </button>
      </section>

      <InfoDialog
        isOpen={showInfo}
        title="Como se calcula la carga semanal"
        onClose={() => setShowInfo(false)}
      >
        <p className="info-dialog__body">
          La <strong>carga semanal</strong> es un porcentaje que compara el volumen total que levantaste esta semana frente al promedio de las 4 semanas anteriores.
        </p>
        <div className="info-dialog__formula">
          <span className="info-dialog__formula-text">
            Carga = (Volumen esta semana / Promedio 4 semanas) x 100
          </span>
        </div>
        <p className="info-dialog__body">
          <strong>Por ejemplo:</strong> si tu promedio es 8,000 kg y esta semana levantaste 10,000 kg, tu carga es del 125%, reflejada al maximo en el anillo.
        </p>
        <p className="info-dialog__body info-dialog__body--motivate">
          {weeklyLoad >= 70
            ? 'Estas en tu mejor nivel. Sigue siendo consistente y tu cuerpo lo recompensara.'
            : weeklyLoad >= 30
            ? 'Progreso estable. Cada semana que entrenas construye una base mas solida que la anterior.'
            : 'El comienzo es el paso mas dificil. Ya lo diste. Cada sesion cuenta, por pequena que sea.'}
        </p>
      </InfoDialog>
    </>
  )
}
