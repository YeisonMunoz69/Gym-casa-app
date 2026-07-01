/* ============================================================
   useExerciseVideo.ts — Video de referencia privado del usuario
   para un ejercicio. Responsabilidad: cargar/guardar/eliminar vía
   exercise-videos.service.ts. NO renderiza nada.
   ============================================================ */
import { useCallback, useEffect, useState } from 'react'
import {
  getUserExerciseVideo,
  saveUserExerciseVideo,
  deleteUserExerciseVideo,
} from '../services/exercise-videos.service'
import { useAuthStore } from '../stores/authStore'
import { detectVideoPlatform, type VideoPlatform } from '../utils/videoEmbed'

type UseExerciseVideoReturn = {
  videoUrl: string | null
  platform: VideoPlatform | null
  loading: boolean
  saving: boolean
  save: (url: string) => Promise<boolean>
  remove: () => Promise<boolean>
}

export function useExerciseVideo(exerciseId: string): UseExerciseVideoReturn {
  const userId = useAuthStore((s) => s.user?.id)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!userId || !exerciseId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const row = await getUserExerciseVideo(userId, exerciseId)
    setVideoUrl(row?.video_url ?? null)
    setLoading(false)
  }, [userId, exerciseId])

  useEffect(() => {
    load()
  }, [load])

  async function save(url: string): Promise<boolean> {
    if (!userId || !exerciseId) return false
    setSaving(true)
    const { error } = await saveUserExerciseVideo(userId, exerciseId, url.trim())
    setSaving(false)
    if (error) return false
    setVideoUrl(url.trim())
    return true
  }

  async function remove(): Promise<boolean> {
    if (!userId || !exerciseId) return false
    setSaving(true)
    const { error } = await deleteUserExerciseVideo(userId, exerciseId)
    setSaving(false)
    if (error) return false
    setVideoUrl(null)
    return true
  }

  return {
    videoUrl,
    platform: videoUrl ? detectVideoPlatform(videoUrl) : null,
    loading,
    saving,
    save,
    remove,
  }
}
