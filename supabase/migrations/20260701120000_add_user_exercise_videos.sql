-- ============================================================
-- Video de referencia por ejercicio (YouTube/TikTok/Instagram) — por usuario
-- Cada usuario guarda su propio link para cada ejercicio del catálogo.
-- Al compartir una rutina, el link del que comparte viaja como sugerencia
-- inicial para quien la importa (ver routines.share.service.ts) — no se
-- comparte en vivo, cada usuario puede cambiar el suyo libremente.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_exercise_videos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises_catalog(id) ON DELETE CASCADE,
  video_url   TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_user_exercise_videos_user_exercise
  ON public.user_exercise_videos (user_id, exercise_id);

ALTER TABLE public.user_exercise_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_exercise_videos_own" ON public.user_exercise_videos;
CREATE POLICY "user_exercise_videos_own" ON public.user_exercise_videos
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reutiliza update_updated_at() ya creado en v2/supabase/migrations/001_new_features.sql
DROP TRIGGER IF EXISTS set_user_exercise_videos_updated_at ON public.user_exercise_videos;
CREATE TRIGGER set_user_exercise_videos_updated_at
  BEFORE UPDATE ON public.user_exercise_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
