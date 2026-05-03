import { useMemo } from 'react'

export type ConsistencyHeatmapProps = {
  heatmap: number[] // Últimos 28 días
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export function ConsistencyHeatmap({ heatmap }: ConsistencyHeatmapProps) {
  const { monthName, year, calendarGrid } = useMemo(() => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const firstDayDate = new Date(currentYear, currentMonth, 1)
    
    // getDay() es 0 para Domingo, queremos 0 para Lunes
    const firstDayOffset = firstDayDate.getDay() === 0 ? 6 : firstDayDate.getDay() - 1
    
    const todayDate = today.getDate()
    
    const grid: { date: number | null; val: number; isToday: boolean }[] = []
    
    // Espacios vacíos antes del día 1
    for (let i = 0; i < firstDayOffset; i++) {
      grid.push({ date: null, val: -1, isToday: false })
    }
    
    // Días del mes
    for (let d = 1; d <= daysInMonth; d++) {
      let val = -1
      const daysAgo = todayDate - d
      
      if (daysAgo >= 0 && daysAgo < heatmap.length) {
        // Encontramos el valor correspondiente en el array heatmap (28 valores terminando en hoy)
        val = heatmap[heatmap.length - 1 - daysAgo]
      }
      
      grid.push({ date: d, val, isToday: daysAgo === 0 })
    }
    
    return {
      monthName: MONTHS[currentMonth],
      year: currentYear,
      calendarGrid: grid
    }
  }, [heatmap])

  const getCellClass = (val: number, hasDate: boolean, isToday: boolean) => {
    let cls = 'dash-heatmap__cell '
    if (!hasDate) cls += 'dash-heatmap__cell--invisible '
    else if (val <= 0) cls += 'dash-heatmap__cell--empty '
    else if (val === 1) cls += 'dash-heatmap__cell--lvl1 '
    else if (val === 2) cls += 'dash-heatmap__cell--lvl2 '
    else if (val === 3) cls += 'dash-heatmap__cell--lvl3 '
    else if (val >= 4) cls += 'dash-heatmap__cell--lvl4 '
    
    if (isToday) {
      cls += 'dash-heatmap__cell--current '
    }
    return cls.trim()
  }

  return (
    <section className="dash-heatmap">
      <div className="dash-heatmap__header">
        <h3 className="dash-heatmap__title">CONSISTENCIA — {monthName.toUpperCase()} {year}</h3>
        <span className="dash-heatmap__value" style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--color-text-secondary)' }}>
          Nivel de carga
        </span>
      </div>
      
      <div className="dash-heatmap__grid">
        {WEEKDAYS.map(d => (
          <div key={d} className="dash-heatmap__day">{d}</div>
        ))}
        {calendarGrid.map((cell, i) => (
          <div 
            key={i} 
            className={getCellClass(cell.val, cell.date !== null, cell.isToday)} 
            style={{ animationDelay: `${i * 0.015}s` }}
            title={cell.date ? `Día ${cell.date}: Nivel ${Math.max(0, cell.val)}` : undefined}
          >
            {cell.date && <span className="dash-heatmap__date">{cell.date}</span>}
          </div>
        ))}
      </div>
    </section>
  )
}
