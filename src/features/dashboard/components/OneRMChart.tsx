import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'
import './OneRMChart.css'

type OneRMChartProps = {
  coefA: number
  coefB: number
  intercept: number
  current1RM: number
  bestSetKg: number
  bestSetReps: number
}

export function OneRMChart({ coefA, coefB, intercept, current1RM, bestSetKg, bestSetReps }: OneRMChartProps) {
  // Generar datos para la curva de equivalencia (1 a 12 repeticiones)
  // Fórmula despejando peso: peso = (1RM - intercept - coef_b * reps) / coef_a
  const data = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const reps = i + 1
      const equivWeight = (current1RM - intercept - coefB * reps) / coefA
      
      return {
        reps,
        label: `${reps} rep${reps > 1 ? 's' : ''}`,
        weight: Math.max(0, Math.round(equivWeight * 10) / 10),
      }
    })
  }, [coefA, coefB, intercept, current1RM])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      const isUserSet = d.reps === bestSetReps
      return (
        <div className="onerm-chart__tooltip">
          <p className="onerm-chart__tooltip-title">{d.label}</p>
          <p className="onerm-chart__tooltip-value">
            <strong>{d.weight} kg</strong>
          </p>
          {isUserSet && <span className="onerm-chart__tooltip-badge">Tu mejor set</span>}
        </div>
      )
    }
    return null
  }

  return (
    <div className="onerm-chart">
      <div className="onerm-chart__header">
        <h4 className="onerm-chart__title">Curva de Equivalencia</h4>
        <p className="onerm-chart__subtitle">Peso necesario para mantener tu 1RM actual ({current1RM} kg)</p>
      </div>
      
      <div className="onerm-chart__container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
            <XAxis 
              dataKey="reps" 
              stroke="var(--color-text-tertiary)" 
              fontSize={11} 
              tickMargin={8}
              tickFormatter={(val) => `${val}r`}
            />
            <YAxis 
              stroke="var(--color-text-tertiary)" 
              fontSize={11} 
              tickFormatter={(val) => `${val}kg`}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="var(--color-primary)" 
              strokeWidth={3} 
              dot={{ r: 3, fill: 'var(--color-surface)', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: 'var(--color-primary)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
              animationDuration={800}
            />
            
            {/* Destacar el punto del mejor set del usuario */}
            <ReferenceDot 
              x={bestSetReps} 
              y={bestSetKg} 
              r={6} 
              fill="var(--color-secondary)" 
              stroke="var(--color-surface)" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="onerm-chart__legend">
        <div className="onerm-chart__legend-item">
          <span className="onerm-chart__legend-color" style={{ background: 'var(--color-primary)' }} />
          <span>Curva del Modelo</span>
        </div>
        <div className="onerm-chart__legend-item">
          <span className="onerm-chart__legend-color" style={{ background: 'var(--color-secondary)' }} />
          <span>Tu Set ({bestSetKg}kg × {bestSetReps})</span>
        </div>
      </div>
    </div>
  )
}
