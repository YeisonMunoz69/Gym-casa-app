/* ============================================================
   useSetAutoSave.ts — Autoguardado de un set por blur en Supabase
   FASE 03 — GYM-YJMG
   Responsabilidad: guarda UN set completado al Supabase.
   NO gestiona lista de sets. NO controla el timer.
   ============================================================ */
import { useCallback, useState } from 'react'
import { saveSessionSet } from '../../../services/sessions.service'
import { useSessionStore } from '../../../stores/sessionStore'
import type { SetDraft } from '../../../types/session'

type UseSetAutoSaveReturn = {
  saveSet: (routineExerciseId: string, draft: SetDraft) => Promise<void>
  isSaving: boolean
  lastError: string | null
}

export function useSetAutoSave(): UseSetAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const sessionExerciseIds = useSessionStore((s) => s.sessionExerciseIds)
  const recordSet = useSessionStore((s) => s.recordSet)

  const saveSet = useCallback(
    async (routineExerciseId: string, draft: SetDraft) => {
      const sessionExerciseId = sessionExerciseIds[routineExerciseId]
      if (!sessionExerciseId) return

      // Actualiza en memoria primero (optimistic)
      recordSet(routineExerciseId, draft)

      // Solo guarda si hay datos
      if (draft.reps === null && draft.weight === null) return

      setIsSaving(true)
      setLastError(null)

      const { error } = await saveSessionSet({
        session_exercise_id: sessionExerciseId,
        set_index: draft.setIndex,
        weight: draft.weight,
        reps: draft.reps,
        rir: draft.rir,
        is_warmup: draft.isWarmup,
        completed_at: draft.completedAt,
      })

      setIsSaving(false)
      if (error) setLastError(error)
    },
    [sessionExerciseIds, recordSet],
  )

  return { saveSet, isSaving, lastError }
}
