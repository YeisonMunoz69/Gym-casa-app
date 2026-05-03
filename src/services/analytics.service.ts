/* ============================================================
   analytics.service.ts — Obtención de métricas del Dashboard
   FASE 04 — GYM-YJMG
   ============================================================ */
import { supabase } from './supabase'

export type DashboardStats = {
  workouts: { completed: number; total: number }
  activeTimeSeconds: number
  weeklyVolume: { label: string; value: number }[]
  heatmap: number[]
}

export async function getDashboardStats(userId: string): Promise<{ data: DashboardStats | null; error: string | null }> {
  // Llamamos a la función optimizada de base de datos
  const { data, error } = await supabase.rpc('get_dashboard_stats', { p_user_id: userId })
  
  if (error) {
    return { data: null, error: error.message }
  }
  
  return { data: data as DashboardStats, error: null }
}

export async function getMuscularBalance(userId: string): Promise<{ subject: string, A: number }[]> {
  const { data, error } = await supabase
    .from('session_exercises')
    .select(`
      completed_sets,
      sessions!inner(user_id, status),
      exercises_catalog(muscle_group)
    `)
    .eq('sessions.user_id', userId)
    .eq('sessions.status', 'completed')
  
  if (error || !data) return []

  const counts: Record<string, number> = {}
  data.forEach((row: any) => {
    const mg = row.exercises_catalog?.muscle_group || 'Otro'
    const sets = row.completed_sets || 0
    counts[mg] = (counts[mg] || 0) + sets
  })

  // Retornar en el formato para RadarChart, ordenado desc
  const sorted = Object.keys(counts)
    .map(mg => ({ subject: mg, A: counts[mg] }))
    .sort((a, b) => b.A - a.A)
  
  // Limitar a los top 6 para que el Radar no se deforme
  return sorted.slice(0, 6)
}

export async function get1RMProgression(userId: string): Promise<{ week: string, value: number }[]> {
  const { data, error } = await supabase
    .from('personal_records')
    .select('achieved_at, one_rep_max_kg')
    .eq('user_id', userId)
    .order('achieved_at', { ascending: true })
    .limit(10)
  
  if (error || !data) return []
  
  return data.map((row: any, index: number) => ({
    week: `R${index + 1}`,
    value: Math.round(row.one_rep_max_kg)
  }))
}
