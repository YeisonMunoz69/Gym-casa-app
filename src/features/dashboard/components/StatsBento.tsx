import { Dumbbell, Timer } from 'lucide-react'

export type StatsBentoProps = {
  workouts: { completed: number; total: number }
  activeTimeSeconds: number
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return { hours: h, minutes: m }
}

export function StatsBento({ workouts, activeTimeSeconds }: StatsBentoProps) {
  const activeTime = formatDuration(activeTimeSeconds)

  return (
    <section className="dash-bento">
      {/* Entrenamientos */}
      <div className="dash-bento__card">
        <div className="dash-bento__header">
          <span className="dash-bento__title">SESIONES 4W</span>
          <Dumbbell size={20} className="dash-bento__icon" />
        </div>
        <div className="dash-bento__body">
          <span className="dash-bento__value">{workouts.completed}</span>
          <span className="dash-bento__sub">/ {workouts.total}</span>
        </div>
      </div>

      {/* Tiempo Activo */}
      <div className="dash-bento__card dash-bento__card--purple">
        <div className="dash-bento__header">
          <span className="dash-bento__title">TIEMPO ACTIVO</span>
          <Timer size={20} className="dash-bento__icon" />
        </div>
        <div className="dash-bento__body">
          <span className="dash-bento__value">
            {activeTime.hours}<span style={{ fontSize: '16px', marginLeft: '2px' }}>h</span>
          </span>
          <span className="dash-bento__sub">{activeTime.minutes}m</span>
        </div>
      </div>
    </section>
  )
}
