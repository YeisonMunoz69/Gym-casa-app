/* ============================================================
   useProgressByExercise.ts — Hook para progresión por ejercicio
   FASE 04 — GYM-YJMG
   ============================================================ */
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../../stores/authStore'
import {
  getExercisesWithHistory,
  getExerciseProgress,
  type ExerciseOption,
  type ProgressPoint,
} from '../../../services/progress.service'

export function useProgressByExercise() {
  const [exercises, setExercises] = useState<ExerciseOption[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [progress, setProgress] = useState<ProgressPoint[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const userId = useAuthStore(s => s.user?.id)

  // Cargar lista de ejercicios con historial
  useEffect(() => {
    if (!userId) return

    async function fetchExercises() {
      setLoadingList(true)
      const { data, error: err } = await getExercisesWithHistory(userId!)
      if (err) {
        setError(err)
      } else {
        setExercises(data)
        if (data.length > 0) setSelectedId(data[0].id)
      }
      setLoadingList(false)
    }

    fetchExercises()
  }, [userId])

  // Cargar progresión cuando cambia el ejercicio seleccionado
  useEffect(() => {
    if (!userId || !selectedId) return

    async function fetchProgress() {
      setLoadingProgress(true)
      const { data, error: err } = await getExerciseProgress(userId!, selectedId!)
      if (err) {
        setError(err)
      } else {
        setProgress(data)
      }
      setLoadingProgress(false)
    }

    fetchProgress()
  }, [userId, selectedId])

  return {
    exercises,
    selectedId,
    setSelectedId,
    progress,
    loadingList,
    loadingProgress,
    error,
  }
}
