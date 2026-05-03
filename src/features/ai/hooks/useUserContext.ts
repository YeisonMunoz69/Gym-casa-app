/* ============================================================
   useUserContext.ts — Reune el contexto del usuario para la IA
   FASE 06 — GYM-YJMG
   Fix: columnas reales de la BD verificadas (session_date,
   start_time, end_time). Queries simplificadas sin joins complejos.
   ============================================================ */
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../../stores/authStore'
import { useProfileStore } from '../../../stores/profileStore'
import { supabase } from '../../../services/supabase'

export type UserContext = {
  name:    string
  goal:    string
  level:   string
  recentSessions: RecentSession[]
  muscleBalance:  MuscleBalance[]
  systemPrompt:   string
}

type RecentSession = {
  date:        string
  durationMin: number
  totalSets:   number
}

type MuscleBalance = {
  muscle: string
  sets:   number
}

const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'perder grasa',
  gain_muscle: 'ganar musculo',
  maintain:    'mantenerse',
  strength:    'fuerza maxima',
  endurance:   'resistencia',
}

const LEVEL_LABELS: Record<string, string> = {
  beginner:     'principiante',
  intermediate: 'intermedio',
  advanced:     'avanzado',
}

const GENDER_LABELS: Record<string, string> = {
  male:   'masculino',
  female: 'femenino',
  other:  'otro',
}

function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null
  const diff = Date.now() - new Date(birthDate).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

type PhysicalMetrics = {
  gender:      string | null
  age:         number | null
  heightCm:    number | null
  currentWeight: number | null
  bodyFatPct:  number | null
}

function buildSystemPrompt(
  ctx: Omit<UserContext, 'systemPrompt'>,
  metrics: PhysicalMetrics,
): string {
  const sessions = ctx.recentSessions.length
    ? ctx.recentSessions
        .map((s) => `  - ${s.date}: ${s.durationMin} min | ${s.totalSets} sets completados`)
        .join('\n')
    : '  Sin sesiones registradas aun.'

  const balance = ctx.muscleBalance.length
    ? ctx.muscleBalance
        .map((m) => `  - ${m.muscle}: ${m.sets} sets`)
        .join('\n')
    : '  Sin datos de balance muscular aun.'

  const physLines: string[] = []
  if (metrics.gender)        physLines.push(`Genero: ${metrics.gender}`)
  if (metrics.age !== null)  physLines.push(`Edad: ${metrics.age} anos`)
  if (metrics.heightCm)      physLines.push(`Altura: ${metrics.heightCm} cm`)
  if (metrics.currentWeight) physLines.push(`Peso actual: ${metrics.currentWeight} kg`)
  if (metrics.bodyFatPct !== null) physLines.push(`% Grasa corporal: ${metrics.bodyFatPct}%`)
  const physBlock = physLines.length
    ? physLines.map((l) => `  - ${l}`).join('\n')
    : '  Sin metricas fisicas registradas.'

  return `
Eres el entrenador personal y nutricionista IA de la app Fitness Casa.
Tu usuario se llama ${ctx.name}. Su objetivo es ${ctx.goal} y nivel: ${ctx.level}.

METRICAS FISICAS DEL USUARIO:
${physBlock}

DATOS REALES DEL USUARIO:
Sesiones recientes (ultimas 7):
${sessions}

Balance muscular acumulado (sets por grupo):
${balance}

REGLAS ESTRICTAS QUE DEBES CUMPLIR SIEMPRE:
1. SOLO responde sobre fitness, entrenamiento, nutricion, recuperacion y bienestar fisico.
2. Si el usuario pregunta algo fuera de estos temas, responde exactamente:
   "Solo puedo ayudarte con temas de entrenamiento, nutricion y recuperacion. Que necesitas saber sobre tu rutina?"
3. Usa los datos reales del usuario cuando sean relevantes. Calcula su IMC si tienes peso y altura.
4. Responde en español, directo y motivador.
5. Nunca uses emojis ni caracteres especiales.
6. Maximo 3 parrafos por respuesta con lenguaje natural.
`.trim()
}

export function useUserContext(): { context: UserContext | null; loading: boolean } {
  const userId  = useAuthStore((s) => s.user?.id)
  const profile = useProfileStore((s) => s.profile)
  const [context, setContext] = useState<UserContext | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    async function build() {
      setLoading(true)

      // ── Query 1: Últimas 7 sesiones completadas ──────────────
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, session_date, start_time, end_time, session_exercises(completed_sets)')
        .eq('user_id', userId!)
        .eq('status', 'completed')
        .order('session_date', { ascending: false })
        .limit(7)

      const recentSessions: RecentSession[] = (sessions ?? []).map((s: any) => {
        const totalSets = (s.session_exercises ?? []).reduce(
          (acc: number, ex: any) => acc + (ex.completed_sets ?? 0), 0
        )
        const durationMin = s.start_time && s.end_time
          ? Math.round(
              (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000
            )
          : 0
        return {
          date:        s.session_date ?? '',
          durationMin,
          totalSets,
        }
      })

      // ── Query 2: Balance muscular ─────────────────────────────
      const sessionIds = (sessions ?? []).map((s: any) => s.id).filter(Boolean)

      let muscleBalance: MuscleBalance[] = []

      if (sessionIds.length > 0) {
        const { data: exData } = await supabase
          .from('session_exercises')
          .select('completed_sets, exercises_catalog(muscle_group)')
          .in('session_id', sessionIds)

        const muscleCounts: Record<string, number> = {}
        for (const row of (exData ?? []) as any[]) {
          const mg = row.exercises_catalog?.muscle_group ?? 'General'
          muscleCounts[mg] = (muscleCounts[mg] ?? 0) + (row.completed_sets ?? 0)
        }
        muscleBalance = Object.entries(muscleCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([muscle, sets]) => ({ muscle, sets }))
      }

      // ── Query 3: Medición corporal más reciente ───────────────
      const { data: lastMeasure } = await supabase
        .from('body_measurements')
        .select('weight_kg, body_fat_pct')
        .eq('user_id', userId!)
        .order('measured_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // ── Construir métricas físicas ────────────────────────────
      const metrics: PhysicalMetrics = {
        gender:        GENDER_LABELS[profile?.gender ?? ''] ?? null,
        age:           calcAge(profile?.birth_date ?? null),
        heightCm:      profile?.height_cm ?? null,
        currentWeight: (lastMeasure as any)?.weight_kg ?? profile?.initial_weight_kg ?? null,
        bodyFatPct:    (lastMeasure as any)?.body_fat_pct ?? null,
      }

      // ── Construir contexto ────────────────────────────────────
      const name  = profile?.full_name?.split(' ')[0] ?? 'Atleta'
      const goal  = GOAL_LABELS[profile?.goal ?? ''] ?? 'mejorar su condicion fisica'
      const level = LEVEL_LABELS[profile?.experience_level ?? ''] ?? 'intermedio'

      const base = { name, goal, level, recentSessions, muscleBalance }
      setContext({ ...base, systemPrompt: buildSystemPrompt(base, metrics) })
      setLoading(false)
    }

    build()
  }, [userId, profile])

  return { context, loading }
}
