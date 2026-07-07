-- ============================================================
-- Fix: Récords Personales nunca se poblaban.
--
-- Causa raíz (v2/supabase/migrations/001_new_features.sql):
-- 1. El trigger que debía llenar personal_records en cada set
--    completado quedó COMENTADO — nunca se creó en la BD real.
-- 2. La función check_and_insert_pr() además referenciaba columnas
--    que no existen en el esquema real: NEW.session_id y
--    NEW.weight_kg en session_sets (la tabla real usa
--    session_exercise_id y weight), y s.routine_day_exercise_id en
--    sessions (no existe esa columna ahí). Aunque se hubiera
--    descomentado el trigger tal cual estaba, habría fallado o no
--    hecho nada.
--
-- Este archivo corrige la función contra el esquema real, crea el
-- trigger, y hace un backfill único de los PRs históricos que se
-- perdieron mientras el trigger estuvo inactivo.
-- ============================================================

-- ── 1. Función corregida ─────────────────────────────────────
CREATE OR REPLACE FUNCTION check_and_insert_pr()
RETURNS TRIGGER AS $$
DECLARE
  v_exercise_id UUID;
  v_user_id     UUID;
  v_session_id  UUID;
  v_new_1rm     NUMERIC;
  v_current_1rm NUMERIC;
BEGIN
  -- Solo procesar sets de trabajo (no calentamiento) con peso y reps válidos
  IF NEW.is_warmup IS TRUE
     OR NEW.weight IS NULL OR NEW.weight <= 0
     OR NEW.reps IS NULL OR NEW.reps <= 0 THEN
    RETURN NEW;
  END IF;

  -- session_sets → session_exercises → sessions (esquema real)
  SELECT se.exercise_id, s.user_id, s.id
    INTO v_exercise_id, v_user_id, v_session_id
    FROM session_exercises se
    JOIN sessions s ON s.id = se.session_id
    WHERE se.id = NEW.session_exercise_id;

  IF v_exercise_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Fórmula de Epley: 1RM estimado = peso * (1 + reps/30)
  v_new_1rm := NEW.weight * (1 + NEW.reps::NUMERIC / 30);

  SELECT MAX(one_rep_max_kg) INTO v_current_1rm
    FROM personal_records
    WHERE user_id = v_user_id AND exercise_id = v_exercise_id;

  IF v_current_1rm IS NULL OR v_new_1rm > v_current_1rm THEN
    INSERT INTO personal_records (user_id, exercise_id, weight_kg, reps, one_rep_max_kg, achieved_at, session_id)
    VALUES (v_user_id, v_exercise_id, NEW.weight, NEW.reps, v_new_1rm, COALESCE(NEW.completed_at, now()), v_session_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. Activar el trigger (nunca se había creado) ────────────
DROP TRIGGER IF EXISTS check_pr_on_set ON session_sets;
CREATE TRIGGER check_pr_on_set
  AFTER INSERT OR UPDATE ON session_sets
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION check_and_insert_pr();

-- ── 3. Backfill de PRs históricos ─────────────────────────────
-- Mientras el trigger estuvo inactivo, ningún set completado generó
-- su récord. Se inserta el mejor 1RM histórico por (usuario, ejercicio)
-- a partir de sesiones ya completadas — solo donde todavía no exista
-- ningún registro, así que es seguro correr esta migración más de una vez.
INSERT INTO personal_records (user_id, exercise_id, weight_kg, reps, one_rep_max_kg, achieved_at, session_id)
SELECT DISTINCT ON (s.user_id, se.exercise_id)
  s.user_id,
  se.exercise_id,
  ss.weight,
  ss.reps,
  ss.weight * (1 + ss.reps::NUMERIC / 30) AS one_rep_max_kg,
  ss.completed_at,
  s.id
FROM session_sets ss
JOIN session_exercises se ON se.id = ss.session_exercise_id
JOIN sessions s ON s.id = se.session_id
WHERE s.status = 'completed'
  AND ss.completed_at IS NOT NULL
  AND ss.is_warmup = false
  AND ss.weight IS NOT NULL AND ss.weight > 0
  AND ss.reps IS NOT NULL AND ss.reps > 0
  AND NOT EXISTS (
    SELECT 1 FROM personal_records pr
    WHERE pr.user_id = s.user_id AND pr.exercise_id = se.exercise_id
  )
ORDER BY s.user_id, se.exercise_id, (ss.weight * (1 + ss.reps::NUMERIC / 30)) DESC;

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
