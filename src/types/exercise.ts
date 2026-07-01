export type ExerciseCatalogRow = {
  id: string
  user_id: string | null
  name: string
  muscle_group: string
  equipment: string | null
  instructions: string | null
  image_url: string | null
  video_url: string | null
  media_source_type: 'external_url' | 'storage'
  media_thumbnail_url: string | null
  created_at: string
  updated_at: string
}

/** Whether exercise is global (user_id=null) or user-created */
export type ExerciseOrigin = 'global' | 'custom'

/** Video de referencia (YouTube/TikTok/Instagram) que cada usuario guarda
 *  para un ejercicio del catálogo — privado, no lo ve nadie más. */
export type UserExerciseVideoRow = {
  id: string
  user_id: string
  exercise_id: string
  video_url: string
  created_at: string
  updated_at: string
}
