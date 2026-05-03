/* ============================================================
   SessionMotivation.tsx — Mensaje motivacional post-sesión
   FASE 06 — GYM-YJMG
   Llama a Gemini para el mensaje personalizado.
   Si la API falla o no hay clave → pool estático como fallback.
   Sin emojis (SKILL-CODE §5.4). Límite: 150 líneas.
   ============================================================ */
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, TrendingUp, Zap, Shield, Flame, Award, ChevronRight } from 'lucide-react'
import { generateMotivation } from '../../../services/ai.service'
import type { SessionSummaryData } from '../../../types/session'
import './SessionMotivation.css'

type SessionMotivationProps = {
  data: SessionSummaryData
  withBonus: boolean
  onClose: () => void
}

type StaticEntry = {
  headline: string
  sub: string
  Icon: React.FC<{ size?: number; className?: string }>
}

const BASE_POOL: StaticEntry[] = [
  { headline: 'Eres constante. Eso vale mas que el talento.',      sub: 'Cada sesion completa es un voto por la persona que quieres ser.',           Icon: Shield    },
  { headline: 'Hoy ganaste cuando podrias haber descansado.',       sub: 'La disciplina construye lo que la motivacion solo promete.',                 Icon: Flame     },
  { headline: 'El progreso existe aunque no lo veas hoy.',          sub: 'Tu cuerpo procesa cada serie mucho tiempo despues de que terminas.',         Icon: TrendingUp },
  { headline: 'Terminaste. La mayoria ni empezo.',                   sub: 'Esa diferencia se acumula cada semana que entrenas.',                        Icon: Star      },
  { headline: 'Sin excusas. Sin atajos. Solo trabajo.',              sub: 'Eso es exactamente lo que hiciste hoy.',                                     Icon: Zap       },
  { headline: 'Cada kilo levantado es un argumento contra el limite.', sub: 'Y hoy levantaste muchos.',                                                 Icon: Award     },
]

const BONUS_POOL: StaticEntry[] = [
  { headline: 'El ejercicio extra que otros omiten. Tu lo hiciste.', sub: 'Ese margen de esfuerzo es lo que te separa del promedio.',                  Icon: Flame     },
  { headline: 'Bonus completado. Mentalidad de campeon.',            sub: 'No te conformas con el minimo. Eso se nota en resultados.',                  Icon: Award     },
  { headline: 'Ejercicio extra. Sin titubear.',                      sub: 'Cuando la mente dice basta, el cuerpo aprende quien manda.',                 Icon: Zap       },
]

function pickStaticFallback(withBonus: boolean): StaticEntry {
  const pool = withBonus ? [...BASE_POOL, ...BONUS_POOL] : BASE_POOL
  return pool[Math.floor(Math.random() * pool.length)]
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m} minutos`
}

export function SessionMotivation({ data, withBonus, onClose }: SessionMotivationProps) {
  const fallback = pickStaticFallback(withBonus)
  const [aiText, setAiText]     = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(true)

  useEffect(() => {
    const dominant = (data as any).dominantMuscle as string | undefined
    generateMotivation({
      durationSeconds: data.durationSeconds,
      totalVolume:     data.totalVolume,
      muscleGroup:     dominant ?? 'General',
      withBonus,
    }).then((result) => {
      setAiText(result)
      setAiLoading(false)
    })
  }, [data, withBonus])

  const headline = aiText ?? fallback.headline
  const sub      = aiText ? '' : fallback.sub     // AI ya incluye todo en una frase
  const Icon     = fallback.Icon

  return (
    <div className="session-motivation">
      <div className="session-motivation__bg" aria-hidden="true" />

      <motion.div
        className="session-motivation__card"
        initial={{ opacity: 0, scale: 0.88, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      >
        {/* Icono central */}
        <motion.div
          className="session-motivation__icon-ring"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.15 }}
        >
          <Icon size={32} className="session-motivation__icon" />
        </motion.div>

        {/* Mensaje */}
        <motion.div
          className="session-motivation__copy"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          {aiLoading ? (
            <div className="session-motivation__skeleton" />
          ) : (
            <>
              <h1 className="session-motivation__headline">{headline}</h1>
              {sub && <p className="session-motivation__sub">{sub}</p>}
            </>
          )}
        </motion.div>

        {/* Stat de la sesion */}
        <motion.div
          className="session-motivation__stat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span className="session-motivation__stat-label">Tiempo activo</span>
          <span className="session-motivation__stat-value">{formatDuration(data.durationSeconds)}</span>
          {withBonus && (
            <span className="session-motivation__bonus-badge">
              <Zap size={10} />
              Con ejercicio bonus
            </span>
          )}
        </motion.div>

        {/* CTA */}
        <motion.button
          className="session-motivation__cta"
          whileTap={{ scale: 0.96 }}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Volver al inicio
          <ChevronRight size={16} />
        </motion.button>
      </motion.div>
    </div>
  )
}
