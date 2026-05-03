import { useState, useEffect } from 'react'
import { Plus, Scale, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { addBodyMeasurement, getBodyMeasurements } from '../../../services/profiles.service'
import type { BodyMeasurement } from '../../../services/profiles.service'
import { Button } from '../../../components/ui/Button'
import { showToast } from '../../../components/ui/Toast'
import './BodyMeasurementLog.css'

export function BodyMeasurementLog() {
  const userId = useAuthStore((s) => s.user?.id)
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [showForm, setShowForm] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (userId) loadMeasurements(userId)
  }, [userId])

  async function loadMeasurements(uid: string) {
    const data = await getBodyMeasurements(uid)
    setMeasurements(data)
  }

  async function handleAdd() {
    if (!userId || !weightInput) return
    const weight = parseFloat(weightInput)
    if (isNaN(weight) || weight < 20 || weight > 400) {
      showToast('Peso inválido (20-400 kg)', 'error')
      return
    }
    setSaving(true)
    const { error } = await addBodyMeasurement(userId, weight)
    setSaving(false)
    if (error) { showToast('Error al guardar medida', 'error'); return }
    showToast(`${weight} kg registrado`, 'success')
    setWeightInput('')
    setShowForm(false)
    await loadMeasurements(userId)
  }

  function getTrend(index: number): 'up' | 'down' | 'same' {
    if (index >= measurements.length - 1) return 'same'
    const curr = measurements[index].weight_kg
    const prev = measurements[index + 1].weight_kg
    if (curr > prev) return 'up'
    if (curr < prev) return 'down'
    return 'same'
  }

  const latestWeight = measurements[0]?.weight_kg

  return (
    <section className="measure-log">
      <div className="measure-log__header">
        <div className="measure-log__title-row">
          <Scale size={16} />
          <h2 className="measure-log__title">Historial de peso</h2>
        </div>
        <Button variant="primary" size="sm" cyber onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} />
          Registrar peso
        </Button>
      </div>

      {latestWeight && (
        <div className="measure-log__current">
          <span className="measure-log__current-label">Peso actual</span>
          <span className="measure-log__current-value">{latestWeight} kg</span>
        </div>
      )}

      {showForm && (
        <div className="measure-log__form">
          <input
            id="measure-weight"
            type="number"
            className="measure-log__input"
            placeholder="Ej: 78.5"
            step={0.1}
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            autoFocus
          />
          <span className="measure-log__form-unit">kg</span>
          <Button variant="primary" size="sm" loading={saving} onClick={handleAdd}>
            Guardar
          </Button>
        </div>
      )}

      {measurements.length === 0 && (
        <p className="measure-log__empty">Sin medidas registradas. Registra tu primer peso para empezar el seguimiento.</p>
      )}

      <div className="measure-log__list">
        {measurements.map((m, i) => {
          const trend = getTrend(i)
          return (
            <div key={m.id} className="measure-log__item">
              <div className="measure-log__trend" data-trend={trend}>
                {trend === 'up' && <TrendingUp size={14} />}
                {trend === 'down' && <TrendingDown size={14} />}
                {trend === 'same' && <Minus size={14} />}
              </div>
              <span className="measure-log__weight">{m.weight_kg} kg</span>
              <span className="measure-log__date">{new Date(m.measured_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
