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

// Ventana reciente para el radar de balance — antes sumaba TODO el
// historial desde siempre, lo que diluía cambios de enfoque recientes.
const MUSCULAR_BALANCE_WINDOW_DAYS = 56 // 8 semanas

// Máximo de radios (ejes) que se muestran en el radar antes de que se
// vea saturado en una pantalla de celular. El resto no se descarta —
// se agrupa en "Otros" para no esconder que hubo entrenamiento ahí.
const MUSCULAR_BALANCE_MAX_AXES = 8

export async function getMuscularBalance(userId: string): Promise<{ subject: string, A: number }[]> {
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - MUSCULAR_BALANCE_WINDOW_DAYS)
  const fromStr = fromDate.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('session_exercises')
    .select(`
      completed_sets,
      sessions!inner(user_id, status, session_date),
      exercises_catalog(muscle_group)
    `)
    .eq('sessions.user_id', userId)
    .eq('sessions.status', 'completed')
    .gte('sessions.session_date', fromStr)

  if (error || !data) return []

  const counts: Record<string, number> = {}
  data.forEach((row: any) => {
    const mg = row.exercises_catalog?.muscle_group || 'Otro'
    const sets = row.completed_sets || 0
    counts[mg] = (counts[mg] || 0) + sets
  })

  // Ordenado desc — los grupos menos entrenados en la ventana reciente son
  // justo los que delatan un desbalance, así que no se descartan en
  // silencio: si hay más de MUSCULAR_BALANCE_MAX_AXES, los más chicos se
  // agrupan en "Otros" en vez de desaparecer (evita un radar saturado con
  // 15 ejes ilegibles en un celular).
  const sorted = Object.keys(counts)
    .map(mg => ({ subject: mg, A: counts[mg] }))
    .sort((a, b) => b.A - a.A)

  if (sorted.length <= MUSCULAR_BALANCE_MAX_AXES) return sorted

  const top = sorted.slice(0, MUSCULAR_BALANCE_MAX_AXES - 1)
  const restTotal = sorted.slice(MUSCULAR_BALANCE_MAX_AXES - 1).reduce((sum, r) => sum + r.A, 0)
  return [...top, { subject: 'Otros', A: restTotal }]
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
