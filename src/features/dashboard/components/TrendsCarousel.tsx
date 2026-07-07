import { useState, type UIEvent } from 'react'
import { TrendingUp, Crosshair } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, YAxis, Radar, RadarChart, PolarGrid, PolarAngleAxis, Tooltip } from 'recharts'

export type TrendsCarouselProps = {
  weeklyVolume: { label: string; value: number; rawValue: number }[]
  prProgression: { week: string; value: number }[]
  muscularBalance: { subject: string; A: number }[]
}

// Abrevia etiquetas largas para que no se amontonen alrededor del radar
// en pantallas de celular (ej. con 8 ejes a la vez).
const RADAR_LABEL_ABBREVIATIONS: Record<string, string> = {
  'Cuerpo Completo': 'Cuerpo',
  'Espalda Alta': 'Esp. Alta',
  'Espalda Baja': 'Esp. Baja',
  'Bonificacion': 'Bonus',
  'Estiramiento': 'Estirar',
  'Pantorrilla': 'Pantorr.',
}

function abbreviateRadarLabel(label: string): string {
  return RADAR_LABEL_ABBREVIATIONS[label] ?? label
}

export function TrendsCarousel({ weeklyVolume, prProgression, muscularBalance }: TrendsCarouselProps) {
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number | null>(null)
  const [activeCard, setActiveCard] = useState(0)
  
  const activeWeek = selectedWeekIdx !== null ? weeklyVolume[selectedWeekIdx] : weeklyVolume[3]
  const isInteracting = selectedWeekIdx !== null

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const scrollLeft = el.scrollLeft
    const width = el.offsetWidth
    const index = Math.round(scrollLeft / width)
    if (index !== activeCard) {
      setActiveCard(index)
    }
  }

  return (
    <section className="dash-carousel">
      <div className="dash-carousel__header">
        <h2 className="dash-carousel__title">Tendencias</h2>
        <div className="dash-carousel__dots">
          <div className={`dash-carousel__dot ${activeCard === 0 ? 'dash-carousel__dot--active' : ''}`}></div>
          <div className={`dash-carousel__dot ${activeCard === 1 ? 'dash-carousel__dot--active' : ''}`}></div>
          <div className={`dash-carousel__dot ${activeCard === 2 ? 'dash-carousel__dot--active' : ''}`}></div>
        </div>
      </div>

      <div className="dash-carousel__track" onScroll={handleScroll}>

        {/* Tarjeta 1: Balance Muscular (RadarChart, ahora primera y morada) */}
        <div className="dash-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="dash-bento__header" style={{ marginBottom: 0 }}>
            <span className="dash-bento__title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              BALANCE MUSCULAR <Crosshair size={14} color="var(--color-accent-purple)" />
            </span>
          </div>
          
          <div style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {muscularBalance.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart cx="50%" cy="50%" outerRadius="58%" data={muscularBalance}>
                  <PolarGrid stroke="var(--glass-border)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tickFormatter={abbreviateRadarLabel}
                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 9, fontWeight: 600 }}
                  />
                  <Radar name="Balance" dataKey="A" stroke="var(--color-accent-purple)" strokeWidth={2} fill="var(--color-accent-purple)" fillOpacity={0.4} isAnimationActive={true} animationDuration={1500} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Aún no hay datos de grupos musculares</span>
            )}
          </div>
        </div>

        {/* Tarjeta 2: Volumen Semanal */}
        <div className="dash-card">
          <div className="dash-bento__header">
            <span className="dash-bento__title">VOLUMEN (KG)</span>
            <span 
              style={{ 
                fontSize: '12px', 
                color: isInteracting ? 'var(--color-primary)' : 'var(--color-text-secondary)', 
                fontWeight: 600,
                transition: 'color 0.2s'
              }}
            >
              {activeWeek.label}: {activeWeek.rawValue.toLocaleString()} kg
            </span>
          </div>
          
          <div className="dash-chart" onMouseLeave={() => setSelectedWeekIdx(null)}>
            <div className="dash-chart__grid">
              <div className="dash-chart__line"></div>
              <div className="dash-chart__line"></div>
              <div className="dash-chart__line"></div>
            </div>
            
            {weeklyVolume.map((item, i) => {
              const isActive = (selectedWeekIdx !== null) ? selectedWeekIdx === i : i === weeklyVolume.length - 1
              return (
                <div 
                  key={item.label} 
                  className="dash-chart__col"
                  onMouseEnter={() => setSelectedWeekIdx(i)}
                  onClick={() => setSelectedWeekIdx(i)}
                  style={{ cursor: 'pointer' }}
                >
                  <div 
                    className={`dash-chart__bar ${isActive ? 'dash-chart__bar--active' : ''}`}
                    style={{ height: `${item.value}%`, animationDelay: `${i * 0.1}s` }}
                  ></div>
                  <span className={`dash-chart__label ${isActive ? 'dash-chart__label--active' : ''}`}>
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tarjeta 3: Progreso 1RM */}
        <div className="dash-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="dash-bento__header" style={{ marginBottom: 0 }}>
            <span className="dash-bento__title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              PROGRESIÓN 1RM <TrendingUp size={14} color="var(--color-accent-cyan)" />
            </span>
          </div>
          
          <div style={{ width: '100%', height: '150px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {prProgression.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={prProgression} margin={{ top: 15, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent-cyan)" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="var(--color-accent-cyan)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--color-accent-cyan)', fontWeight: 600 }}
                    labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    name="1RM (Kg)"
                    stroke="var(--color-accent-cyan)" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#color1RM)" 
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>No hay suficientes PRs registrados</span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
