/* ============================================================
   DashboardScreen.tsx — Pantalla de Inicio / Dashboard
   FASE 04 — GYM-YJMG
   Responsabilidad: Renderizar métricas clave con el diseño premium.
   Orden revisado: ProgressByExercise sube antes de PersonalRecords.
   SessionHistory eliminado de aquí — vive en HistoryScreen (Header).
   ============================================================ */
import { useDashboard } from '../hooks/useDashboard'
import { useQuoteVisibility } from '../hooks/useQuoteVisibility'
import { WeeklyLoadRing } from './WeeklyLoadRing'
import { StatsBento } from './StatsBento'
import { DashboardActions } from './DashboardActions'
import { TrendsCarousel } from './TrendsCarousel'
import { ConsistencyHeatmap } from './ConsistencyHeatmap'
import { DailyQuote } from './DailyQuote'
import './DashboardScreen.css'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'

export function DashboardScreen() {
  const { stats, loading, error } = useDashboard()
  const { showQuote } = useQuoteVisibility()

  if (loading) {
    return (
      <div className="loading-fullscreen">
        <HamsterLoader size={120} />
        <span className="loading-fullscreen__label">Cargando métricas...</span>
      </div>
    )
  }

  if (error || !stats) {
    return <div className="dashboard-error">Error al cargar analíticas: {error}</div>
  }

  const { workouts, activeTimeSeconds, weeklyVolume, heatmap } = stats
  const prProgression = (stats as any).prProgression || []
  const muscularBalance = (stats as any).muscularBalance || []
  const weeklyLoad = (stats as any).weeklyLoad || 0

  return (
    <div className="dashboard-screen">

      {/* 1. Grid de Resumen (Bento) */}
      <StatsBento workouts={workouts} activeTimeSeconds={activeTimeSeconds} />

      {/* 2. Anillo Central Inmersivo */}
      <WeeklyLoadRing weeklyLoad={weeklyLoad} />

      {/* 3. Llamado a la acción */}
      <DashboardActions />

      {/* 4. Carrusel de Gráficas */}
      <TrendsCarousel
        weeklyVolume={weeklyVolume as any}
        prProgression={prProgression}
        muscularBalance={muscularBalance}
      />

      {/* 5. Frase del día */}
      {showQuote && <DailyQuote />}

      {/* 6. Heatmap de Consistencia */}
      <ConsistencyHeatmap heatmap={heatmap} />



    </div>
  )
}
