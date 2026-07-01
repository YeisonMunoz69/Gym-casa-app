/* ============================================================
   ActiveSessionView.tsx — Layout orquestador de la sesión activa
   FASE 03.2 — GYM-YJMG
   Responsabilidad: layout y flujo. Delega lógica a hooks y subcomponentes.
   ============================================================ */
import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useSessionStore } from '../../../stores/sessionStore'
import { useActiveSession } from '../hooks/useActiveSession'
import { useBeforeUnload } from '../hooks/useBeforeUnload'
import { SessionHeader } from './SessionHeader'
import { ExerciseHeroCard } from './ExerciseHeroCard'
import { SetTracker } from './SetTracker'
import { NextExercisePeek } from './NextExercisePeek'
import { ExerciseQueue } from './ExerciseQueue'
import { SessionSummary } from './SessionSummary'
import { SessionMotivation } from './SessionMotivation'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { BonusTrackPicker } from './BonusTrackPicker'
import { showToast } from '../../../components/ui/Toast'
import type { SessionSummaryData } from '../../../types/session'
import './ActiveSessionView.css'

export function ActiveSessionView() {
  const exercises = useSessionStore((s) => s.exercises)
  const currentIndex = useSessionStore((s) => s.currentExerciseIndex)
  const sets = useSessionStore((s) => s.sets)
  const dayLabel = useSessionStore((s) => s.dayLabel)
  const status = useSessionStore((s) => s.status)
  const clearSession = useSessionStore((s) => s.clearSession)
  const startTimer = useSessionStore((s) => s.startTimer)

  const { finishSession, navigateNext, navigatePrev, abortSession, addBonusExercise } = useActiveSession()

  // Proteger el progreso de la rutina ante recarga o cierre de pestaña.
  // El browser mostrará su dialog nativo: "¿Salir? Los cambios no se guardarán".
  // Se desactiva automáticamente cuando status cambia a 'done' o 'idle'.
  useBeforeUnload(status === 'active')

  const [summaryData, setSummaryData] = useState<SessionSummaryData | null>(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [showBonusPicker, setShowBonusPicker] = useState(false)
  const [showMotivation, setShowMotivation] = useState(false)
  const [bonusUsed, setBonusUsed] = useState(false)
  const [showNextOverlay, setShowNextOverlay] = useState(false)

  // Ref para disparar auto-avance desde el callback del timer sin closure stale
  const autoAdvanceRef = useRef<(() => void) | null>(null)

  // Auto-scroll hacia arriba y overlay "¡Comienza!" al cambiar de ejercicio.
  // FIX (2026-07-01): también limpia cualquier auto-avance pendiente. Si el
  // usuario navegó manualmente (botón "Siguiente", NextExercisePeek o cola)
  // antes de que terminara el timer de descanso entre ejercicios, el avance
  // programado en handleSetCompleted quedaba vivo y disparaba un salto
  // "fantasma" adicional cuando el timer finalmente terminaba — saltándose
  // el ejercicio en el que el usuario ya estaba. Cualquier cambio de índice
  // (manual o automático) invalida el avance pendiente; si el cambio SÍ fue
  // el avance automático legítimo, el ref ya se había limpiado un instante
  // antes en handleInterExerciseTimerFinish, así que no hay conflicto.
  // FIX (2026-07-01, drive-by): estos dos hooks vivían después del early
  // return `if (!currentExercise) return null`, violando las reglas de
  // hooks de React (deben llamarse siempre, sin condicionar). Se movieron
  // arriba del return — no dependen de `currentExercise`, así que el
  // comportamiento es idéntico.
  useEffect(() => {
    autoAdvanceRef.current = null
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (currentIndex > 0) {
      setShowNextOverlay(true)
      const t = setTimeout(() => setShowNextOverlay(false), 2000)
      return () => clearTimeout(t)
    }
  }, [currentIndex])

  const currentExercise = exercises[currentIndex] ?? null
  const nextExercise = exercises[currentIndex + 1] ?? null

  const setsCompleted = currentExercise
    ? (sets[currentExercise.routineExerciseId] ?? []).filter((s) => s.completedAt !== null).length
    : 0

  if (!currentExercise) return null

  async function executeFinishSession() {
    setShowFinishConfirm(false)
    const summary = await finishSession()
    if (summary) setSummaryData(summary)
  }

  function handleFinishSession() {
    setShowFinishConfirm(true)
  }

  async function handleExitConfirmed() {
    await abortSession()
    setShowExitConfirm(false)
  }

  /** Cuando termina el timer entre ejercicios → avanzar automáticamente */
  function handleInterExerciseTimerFinish() {
    autoAdvanceRef.current?.()
    autoAdvanceRef.current = null
  }

  /**
   * Al completar un set:
   * - Si es el último set del ejercicio actual → usa restBetweenExercisesSeconds
   *   y programa auto-avance al terminar.
   * - Si NO es el último → usa restSeconds (descanso normal entre sets).
   * - Si es el último set del ÚLTIMO ejercicio → no inicia timer.
   */
  function handleSetCompleted() {
    const exId = currentExercise!.routineExerciseId
    const allSets     = sets[exId] ?? []
    const totalSets   = allSets.length
    const nowDone     = allSets.filter((s) => s.completedAt !== null).length + 1 // +1 el que acaba de completarse
    const isLastSet   = nowDone >= totalSets
    const isLastEx    = currentIndex === exercises.length - 1

    if (!isLastSet) {
      // Descanso normal entre sets del mismo ejercicio
      startTimer(currentExercise!.restSeconds)
      return
    }

    if (isLastEx) {
      // Último set del último ejercicio → no hay nada que avanzar
      return
    }

    // Último set → descanso entre ejercicios + auto-avance al terminar
    const interRest = currentExercise!.restBetweenExercisesSeconds ?? 120
    autoAdvanceRef.current = navigateNext
    startTimer(interRest)
  }

  async function handleBonusConfirm(exerciseId: string, exerciseName: string, targetSets: number) {
    setShowBonusPicker(false)
    await addBonusExercise(exerciseId, exerciseName, targetSets)
    showToast(`${exerciseName} agregado a la sesión`, 'success')
  }

  const isLastExercise = currentIndex === exercises.length - 1

  if (status === 'done' && showMotivation && summaryData) {
    return (
      <SessionMotivation
        data={summaryData}
        withBonus={bonusUsed}
        onClose={clearSession}
      />
    )
  }

  if (status === 'done' && summaryData) {
    return (
      <SessionSummary
        data={summaryData}
        exercises={exercises}
        onClose={() => setShowMotivation(true)}
        onBonusAccepted={() => setBonusUsed(true)}
      />
    )
  }

  return (
    <div className="active-session">
      <SessionHeader
        dayLabel={dayLabel}
        currentIndex={currentIndex}
        totalExercises={exercises.length}
        onRequestExit={() => setShowExitConfirm(true)}
        onToggleQueue={() => setShowQueue((v) => !v)}
        queueOpen={showQueue}
        onTimerFinish={handleInterExerciseTimerFinish}
      />

      <div className="active-session__content">
        {showQueue ? (
          <ExerciseQueue />
        ) : (
          <>
            <ExerciseHeroCard
              exercise={currentExercise}
              setsCompleted={setsCompleted}
            />

            <SetTracker
              exercise={currentExercise}
              onSetCompleted={handleSetCompleted}
            />

            {nextExercise && (
              <NextExercisePeek
                exercise={nextExercise}
                onClick={navigateNext}
              />
            )}
          </>
        )}

        <div className="active-session__nav">
          {currentIndex > 0 && (
            <button
              className="active-session__nav-btn active-session__nav-btn--prev"
              onClick={navigatePrev}
            >
              Anterior
            </button>
          )}

          {isLastExercise ? (
            <button
              className="active-session__nav-btn active-session__nav-btn--finish"
              onClick={handleFinishSession}
              disabled={status === 'completing'}
            >
              {status === 'completing' ? 'Guardando...' : 'Finalizar'}
            </button>
          ) : (
            <button
              className="active-session__nav-btn active-session__nav-btn--next"
              onClick={navigateNext}
            >
              Siguiente
            </button>
          )}
        </div>

        {/* Botón flotante Bonus Track */}
        <button
          className="active-session__bonus-btn"
          onClick={() => setShowBonusPicker(true)}
          aria-label="Agregar ejercicio extra"
        >
          <Plus size={18} />
          <span>Agregar ejercicio</span>
        </button>
      </div>

      <ConfirmDialog
        isOpen={showExitConfirm}
        title="Salir del entrenamiento"
        message="Si sales ahora, los sets no guardados se perderán. ¿Continuar?"
        confirmLabel="Salir"
        variant="danger"
        onConfirm={handleExitConfirmed}
        onCancel={() => setShowExitConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showFinishConfirm}
        title="Finalizar Entrenamiento"
        message="¿Estás seguro que deseas finalizar y guardar este entrenamiento?"
        confirmLabel="Finalizar"
        variant="primary"
        onConfirm={executeFinishSession}
        onCancel={() => setShowFinishConfirm(false)}
      />

      {showBonusPicker && (
        <BonusTrackPicker
          onConfirm={handleBonusConfirm}
          onClose={() => setShowBonusPicker(false)}
        />
      )}

      {/* Overlay: ¡Comienza! */}
      {showNextOverlay && (
        <div className="active-session__next-overlay">
          <span>¡Comienza!</span>
        </div>
      )}
    </div>
  )
}
