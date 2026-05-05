/* ============================================================
   ImportRoutineScreen.tsx — Pantalla de importación via QR link
   FASE 05.5 v3 — GYM-YJMG
   Soporta:
     ?share=UUID  → descarga snapshot de shared_routines (nuevo)
     ?r=BASE64    → decodifica payload legacy (retrocompatibilidad)
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Dumbbell, AlertTriangle } from 'lucide-react'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import { Button } from '../../../components/ui/Button'
import { showToast } from '../../../components/ui/Toast'
import { useAuthStore } from '../../../stores/authStore'
import {
  fetchRoutineSnapshot,
  decodeBase64ToPayload,
  importSharedRoutine,
} from '../../../services/routines.share.service'
import type { SharedRoutinePayload } from '../../../types/routine'
import { WEEKDAY_LABELS } from '../../../types/routine'
import './ImportRoutineScreen.css'

export function ImportRoutineScreen() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id)

  const [payload, setPayload] = useState<SharedRoutinePayload | null>(null)
  const [decodeError, setDecodeError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)

  useEffect(() => {
    resolvePayloadFromUrl()
  }, [searchParams])

  async function resolvePayloadFromUrl() {
    const shareId = searchParams.get('share')
    const base64 = searchParams.get('r')

    if (shareId) {
      const { payload: fetched, error } = await fetchRoutineSnapshot(shareId)
      if (error || !fetched) { setDecodeError(error ?? 'Rutina no encontrada'); return }
      setPayload(fetched)
      return
    }

    if (base64) {
      const { payload: decoded, error } = decodeBase64ToPayload(base64)
      if (error || !decoded) { setDecodeError(error ?? 'Código QR inválido'); return }
      setPayload(decoded)
      return
    }

    setDecodeError('No se encontró un código de rutina válido en la URL.')
  }

  async function handleImport() {
    if (!payload || !userId) return
    setImporting(true)
    const { error } = await importSharedRoutine(userId, payload)
    setImporting(false)

    if (error) { showToast(`Error al importar: ${error}`, 'error'); return }
    setImported(true)
    showToast('Rutina importada correctamente', 'success')
    setTimeout(() => navigate('/routines'), 1800)
  }

  if (decodeError) return <ImportError message={decodeError} onBack={() => navigate('/')} />

  if (!payload) return (
    <div className="import-screen loading-fullscreen">
      <HamsterLoader size={120} />
      <span className="loading-fullscreen__label">Cargando rutina...</span>
    </div>
  )

  if (imported) return (
    <div className="import-screen import-screen--success">
      <CheckCircle size={64} className="import-screen__success-icon" />
      <h1>Rutina importada</h1>
      <p>Redirigiendo a tus rutinas...</p>
    </div>
  )

  const totalExercises = payload.days.reduce((sum, d) => sum + d.exercises.length, 0)

  return (
    <div className="import-screen">
      <div className="import-screen__badge">
        <Dumbbell size={18} />
        Rutina compartida
      </div>

      <h1 className="import-screen__title">{payload.routineName}</h1>

      <div className="import-screen__meta">
        <span>{payload.days.length} día{payload.days.length !== 1 ? 's' : ''}</span>
        <span className="import-screen__dot" />
        <span>{totalExercises} ejercicio{totalExercises !== 1 ? 's' : ''}</span>
      </div>

      <div className="import-screen__days">
        {payload.days.map((day) => (
          <div key={day.weekday} className="import-day">
            <h3 className="import-day__label">{WEEKDAY_LABELS[day.weekday]}</h3>
            <ul className="import-day__exercises">
              {day.exercises.map((ex, i) => (
                <li key={i} className="import-day__exercise">
                  <Dumbbell size={14} className="import-day__icon" />
                  <span>{ex.exerciseName}</span>
                  <span className="import-day__sets">
                    {ex.targetSets} × {ex.repMin}–{ex.repMax} reps
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {!userId && (
        <p className="import-screen__login-hint">
          Debes iniciar sesión para importar esta rutina.
        </p>
      )}

      <div className="import-screen__actions">
        <Button variant="ghost" size="md" onClick={() => navigate('/')}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="md"
          loading={importing}
          disabled={!userId || importing}
          onClick={handleImport}
        >
          <CheckCircle size={16} />
          Importar rutina
        </Button>
      </div>
    </div>
  )
}

function ImportError({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="import-screen import-screen--error">
      <AlertTriangle size={56} className="import-screen__error-icon" />
      <h1>QR inválido</h1>
      <p>{message}</p>
      <Button variant="secondary" size="md" onClick={onBack}>Volver al inicio</Button>
    </div>
  )
}
