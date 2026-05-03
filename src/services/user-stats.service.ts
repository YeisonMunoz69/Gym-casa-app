/* ============================================================
   user-stats.service.ts — Estadisticas por usuario (solo super-admin)
   FASE 06 — GYM-YJMG
   Responsabilidad: queries de sesiones y ban/unban de usuarios.
   Limite: 150 lineas — SKILL-CODE §2.3
   ============================================================ */
import { supabase } from './supabase'

export type UserStats = {
  totalSessions:       number
  totalMinutes:        number
  lastSessionDate:     string | null
  daysSinceLastSession: number | null
  topMuscleGroup:      string | null
  currentStreak:       number
}

type SessionRow = {
  session_date: string
  start_time:   string
  end_time:     string | null
  status:       string
}

type SessionExerciseRow = {
  session_id: string
  exercises_catalog: { muscle_group: string } | null
}

/** Estadisticas completas de un usuario */
export async function fetchUserStats(userId: string): Promise<UserStats> {
  const [sessionsRes, exercisesRes] = await Promise.all([
    supabase
      .from('sessions')
      .select('session_date, start_time, end_time, status')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('session_date', { ascending: false }),
    supabase
      .from('session_exercises')
      .select('session_id, exercises_catalog(muscle_group)')
      .in('session_id', await getCompletedSessionIds(userId)),
  ])

  const sessions = (sessionsRes.data ?? []) as SessionRow[]
  const exercises = ((exercisesRes.data ?? []) as unknown) as SessionExerciseRow[]

  return {
    totalSessions:        computeTotalSessions(sessions),
    totalMinutes:         computeTotalMinutes(sessions),
    lastSessionDate:      sessions[0]?.session_date ?? null,
    daysSinceLastSession: computeDaysSince(sessions[0]?.session_date ?? null),
    topMuscleGroup:       computeTopMuscle(exercises),
    currentStreak:        computeStreak(sessions),
  }
}

async function getCompletedSessionIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .limit(200)
  return (data ?? []).map((r: { id: string }) => r.id)
}

function computeTotalSessions(sessions: SessionRow[]): number {
  return sessions.length
}

function computeTotalMinutes(sessions: SessionRow[]): number {
  return sessions.reduce((acc, s) => {
    if (!s.start_time || !s.end_time) return acc
    const diff = (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000
    return acc + Math.max(0, Math.round(diff))
  }, 0)
}

function computeDaysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / 86_400_000)
}

function computeTopMuscle(exercises: SessionExerciseRow[]): string | null {
  const counts: Record<string, number> = {}
  for (const ex of exercises) {
    const mg = ex.exercises_catalog?.muscle_group
    if (mg) counts[mg] = (counts[mg] ?? 0) + 1
  }
  const entries = Object.entries(counts)
  if (!entries.length) return null
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

function computeStreak(sessions: SessionRow[]): number {
  if (!sessions.length) return 0
  const dates = sessions.map(s => new Date(s.session_date).toDateString())
  let streak = 1
  for (let i = 0; i < dates.length - 1; i++) {
    const curr = new Date(sessions[i].session_date)
    const prev = new Date(sessions[i + 1].session_date)
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000)
    if (diffDays === 1) streak++
    else break
  }
  return streak
}

/* ── Ban / Unban ──────────────────────────────────────────── */

/** Bloquea o desbloquea un usuario (solo super-admin via RLS) */
export async function setUserBanned(
  userId: string,
  banned: boolean,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: banned })
    .eq('id', userId)
  return { error: error?.message ?? null }
}
