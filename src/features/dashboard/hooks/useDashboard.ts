/* ============================================================
   useDashboard.ts — Hook para el estado del Dashboard
   FASE 04 — GYM-YJMG
   ============================================================ */
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../../stores/authStore'
import { getDashboardStats, getMuscularBalance, get1RMProgression, type DashboardStats } from '../../../services/analytics.service'

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userId = useAuthStore(s => s.user?.id)

  useEffect(() => {
    if (!userId) return

    async function fetch() {
      setLoading(true)
      const [statsRes, balanceRes, prRes] = await Promise.all([
        getDashboardStats(userId!),
        getMuscularBalance(userId!),
        get1RMProgression(userId!)
      ])
      
      const { data, error } = statsRes

      if (error) {
        setError(error)
      } else if (data) {
        // En caso de que el volumen max sea muy pequeño, evitamos división por cero en la UI
        const maxVol = Math.max(...data.weeklyVolume.map(v => v.value), 1)
        
        // Transformar la data para la gráfica
        const normalizedVolume = data.weeklyVolume.map(v => ({
          label: v.label,
          rawValue: v.value,
          // Normalizamos de 0 a 100 para la gráfica de CSS
          value: Math.round((v.value / maxVol) * 100)
        }))

        // Calculamos la "carga semanal" (weeklyLoad) como el volumen de esta semana (W4) vs el promedio
        const currentVol = data.weeklyVolume[3]?.value || 0
        const avgVol = data.weeklyVolume.reduce((acc, curr) => acc + curr.value, 0) / 4
        let load = 0
        if (avgVol > 0) {
          load = Math.min(Math.round((currentVol / avgVol) * 100), 100)
        }

        setStats({
          ...data,
          weeklyVolume: normalizedVolume,
          weeklyLoad: load,
          muscularBalance: balanceRes,
          prProgression: prRes
        } as any)
      }
      setLoading(false)
    }

    fetch()
  }, [userId])

  return { stats, loading, error }
}
