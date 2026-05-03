-- ============================================================
-- GYM-YJMG v2 — Migración 001: Nuevas tablas de features
-- Ejecutar con DIRECT_URL (puerto 5432)
-- ============================================================

-- -------------------------------------------------------
-- 1. PERFILES DE USUARIO
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  birth_date      DATE,
  gender          TEXT CHECK (gender IN ('male', 'female', 'other')),
  height_cm       NUMERIC(5,1),
  initial_weight_kg NUMERIC(5,2),
  goal            TEXT CHECK (goal IN ('lose_weight','gain_muscle','maintain','strength','endurance')),
  experience_level TEXT CHECK (experience_level IN ('beginner','intermediate','advanced')),
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

-- -------------------------------------------------------
-- 2. HISTORIAL DE MEDIDAS CORPORALES
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS body_measurements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg    NUMERIC(5,2) NOT NULL,
  body_fat_pct NUMERIC(4,1),
  notes        TEXT,
  measured_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------------------
-- 3. FRASE MOTIVACIONAL DEL DIA
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_quotes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_text  TEXT NOT NULL,
  author      TEXT,
  category    TEXT DEFAULT 'fitness',
  quote_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (quote_date)
);

-- Seed: algunas frases iniciales para que el home funcione desde dia 1
INSERT INTO daily_quotes (quote_text, author, quote_date) VALUES
  ('El dolor que sientes hoy será la fuerza que sientes mañana.', 'Arnold Schwarzenegger', CURRENT_DATE),
  ('No cuentes los días, haz que los días cuenten.', 'Muhammad Ali', CURRENT_DATE + 1),
  ('El éxito no se logra solo con cualidades especiales. Es sobre todo un trabajo de constancia.', 'Jean-Paul Getty', CURRENT_DATE + 2),
  ('Tu cuerpo puede soportar casi cualquier cosa. Es tu mente la que debes convencer.', 'Anónimo', CURRENT_DATE + 3),
  ('Levantar pesos no es solo levantar hierro, es levantar tu propio estándar.', 'Anónimo', CURRENT_DATE + 4)
ON CONFLICT (quote_date) DO NOTHING;

-- -------------------------------------------------------
-- 4. RECORDS PERSONALES (PR)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS personal_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id     UUID NOT NULL REFERENCES exercises_catalog(id) ON DELETE CASCADE,
  weight_kg       NUMERIC(6,2),
  reps            INTEGER,
  one_rep_max_kg  NUMERIC(6,2), -- weight * (1 + reps/30) — Epley formula
  achieved_at     TIMESTAMPTZ DEFAULT now(),
  session_id      UUID
);

-- Indice para consultas de PR por usuario+ejercicio rapido
CREATE INDEX IF NOT EXISTS idx_pr_user_exercise
  ON personal_records (user_id, exercise_id, achieved_at DESC);

-- -------------------------------------------------------
-- 5. RLS — Row Level Security
-- -------------------------------------------------------

-- user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_profiles_own" ON user_profiles;
CREATE POLICY "user_profiles_own" ON user_profiles
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- body_measurements
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "body_measurements_own" ON body_measurements;
CREATE POLICY "body_measurements_own" ON body_measurements
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- daily_quotes: lectura pública, solo admin escribe (via service role)
ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "daily_quotes_read" ON daily_quotes;
CREATE POLICY "daily_quotes_read" ON daily_quotes
  FOR SELECT USING (true);

-- personal_records
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "personal_records_own" ON personal_records;
CREATE POLICY "personal_records_own" ON personal_records
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------
-- 6. TRIGGER: updated_at en user_profiles
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------
-- 7. FUNCION: Calcular y guardar PR al insertar session_set
-- -------------------------------------------------------
-- Se ejecuta automaticamente cuando se guarda un set
-- Si el peso*reps supera el 1RM anterior, guarda nuevo PR
CREATE OR REPLACE FUNCTION check_and_insert_pr()
RETURNS TRIGGER AS $$
DECLARE
  v_exercise_id UUID;
  v_user_id UUID;
  v_new_1rm NUMERIC;
  v_current_1rm NUMERIC;
BEGIN
  -- Obtener exercise_id y user_id desde la sesion
  SELECT s.routine_day_exercise_id, s.user_id
    INTO v_exercise_id, v_user_id
    FROM sessions s
    WHERE s.id = NEW.session_id
    LIMIT 1;

  -- Solo procesar si tenemos peso y reps
  IF NEW.weight_kg IS NULL OR NEW.reps IS NULL OR NEW.weight_kg = 0 THEN
    RETURN NEW;
  END IF;

  -- Calcular 1RM con formula de Epley: w * (1 + r/30)
  v_new_1rm := NEW.weight_kg * (1 + NEW.reps::NUMERIC / 30);

  -- Obtener el 1RM actual del usuario para este ejercicio
  SELECT MAX(one_rep_max_kg) INTO v_current_1rm
    FROM personal_records
    WHERE user_id = v_user_id AND exercise_id = v_exercise_id;

  -- Insertar PR si es un nuevo maximo
  IF v_current_1rm IS NULL OR v_new_1rm > v_current_1rm THEN
    INSERT INTO personal_records (user_id, exercise_id, weight_kg, reps, one_rep_max_kg, session_id)
    VALUES (v_user_id, v_exercise_id, NEW.weight_kg, NEW.reps, v_new_1rm, NEW.session_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nota: el trigger sobre session_sets se activa cuando existe la tabla
-- DROP TRIGGER IF EXISTS check_pr_on_set ON session_sets;
-- CREATE TRIGGER check_pr_on_set
--   AFTER INSERT OR UPDATE ON session_sets
--   FOR EACH ROW EXECUTE FUNCTION check_and_insert_pr();
-- (Descomentar cuando se confirme nombre exacto de la tabla session_sets)

-- ============================================================
-- FIN DE MIGRACIÓN 001
-- ============================================================
