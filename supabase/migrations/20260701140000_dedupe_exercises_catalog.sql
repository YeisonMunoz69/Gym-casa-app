-- ============================================================
-- Fix: ejercicios duplicados en exercises_catalog (ej. "Estiramientos
-- suaves" apareciendo varias veces en el buscador).
--
-- CAUSA RAÍZ ENCONTRADA: 20260418243000_add_cardio_exercises.sql usa
-- `ON CONFLICT (id) DO NOTHING` como si eso evitara duplicados — pero
-- cada fila usa `gen_random_uuid()` para su `id`, que NUNCA choca con
-- nada. Si ese archivo se corrió más de una vez (ej. pegado dos veces
-- en el SQL Editor), cada corrida insertó una copia nueva completa de
-- esos 10 ejercicios (incluyendo "Estiramientos suaves") con IDs
-- distintos — de ahí las duplicadas.
--
-- ⚠️ ESTE ARCHIVO BORRA FILAS. Recomendado: correr primero el PASO 1
-- (solo lectura) para confirmar qué se va a fusionar antes de correr
-- el PASO 2. Idealmente, saca un respaldo/point-in-time antes de
-- correr el PASO 2 si tienes forma de hacerlo desde Supabase.
-- ============================================================

-- ── PASO 1 (solo lectura) — Ejecutar primero para revisar ───
-- Muestra qué grupos de ejercicios se consideran "el mismo" (mismo
-- nombre normalizado + mismo grupo muscular + mismo dueño) y cuántas
-- copias tiene cada uno. Si el resultado está vacío, no hay nada que
-- arreglar y NO hace falta correr el PASO 2.
--
-- SELECT
--   lower(trim(name)) AS nombre_normalizado,
--   muscle_group,
--   user_id,
--   count(*) AS copias,
--   array_agg(id ORDER BY created_at ASC) AS ids
-- FROM exercises_catalog
-- GROUP BY lower(trim(name)), muscle_group, user_id
-- HAVING count(*) > 1
-- ORDER BY copias DESC;

-- ── PASO 2 — Fusionar duplicados ─────────────────────────────
-- Por cada grupo de duplicados, se conserva el más antiguo (created_at)
-- y se reapuntan TODAS las referencias de los demás hacia ese antes de
-- borrarlos — así no se pierde ningún dato de rutinas, sesiones,
-- récords o videos guardados que ya usaban las copias duplicadas.
DO $$
DECLARE
  dup_group RECORD;
  canonical_id UUID;
  loser_id UUID;
BEGIN
  FOR dup_group IN
    SELECT
      (array_agg(id ORDER BY created_at ASC))[1] AS keep_id,
      (array_agg(id ORDER BY created_at ASC))[2:] AS dup_ids
    FROM exercises_catalog
    GROUP BY lower(trim(name)), muscle_group, user_id
    HAVING count(*) > 1
  LOOP
    canonical_id := dup_group.keep_id;

    FOREACH loser_id IN ARRAY dup_group.dup_ids LOOP
      -- Reapuntar referencias en tablas que usan exercise_id
      UPDATE routine_exercises SET exercise_id = canonical_id WHERE exercise_id = loser_id;
      UPDATE session_exercises SET exercise_id = canonical_id WHERE exercise_id = loser_id;
      UPDATE personal_records  SET exercise_id = canonical_id WHERE exercise_id = loser_id;

      -- user_exercise_videos tiene UNIQUE(user_id, exercise_id): si el
      -- usuario ya guardó un video para el ejercicio canónico, se
      -- descarta el del duplicado (no pueden coexistir dos); si no,
      -- se reapunta normalmente.
      DELETE FROM user_exercise_videos uev
      WHERE uev.exercise_id = loser_id
        AND EXISTS (
          SELECT 1 FROM user_exercise_videos uev2
          WHERE uev2.exercise_id = canonical_id AND uev2.user_id = uev.user_id
        );
      UPDATE user_exercise_videos SET exercise_id = canonical_id WHERE exercise_id = loser_id;

      -- Ya no queda ninguna referencia al duplicado — se puede borrar
      DELETE FROM exercises_catalog WHERE id = loser_id;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
