/* ============================================================
   routines.share.service.ts — Exportar e importar rutinas via Supabase snapshots
   FASE 05.5 v3 — GYM-YJMG
   Arquitectura: snapshot JSON en tabla shared_routines → URL corta ?share=UUID
   Retrocompatibilidad: decodeBase64ToPayload para QRs legacy (?r=BASE64)
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { supabase } from './supabase'
import type { SharedRoutinePayload, SharedDayPayload } from '../types/routine'

/* ── TIPOS INTERNOS ─────────────────────────────────────────── */

type ExerciseCatalogJoin = {
  id: string
  name: string
  muscle_group: string
  equipment: string | null
  image_url: string | null
}

/* ── CONSTRUIR PAYLOAD COMPLETO ──────────────────────────────── */

export async function buildRoutinePayload(
  routineId: string,
): Promise<{ payload: SharedRoutinePayload | null; error: string | null }> {
  const { data: routine, error: rErr } = await supabase
    .from('routines')
    .select('id, name')
    .eq('id', routineId)
    .single()

  if (rErr || !routine) return { payload: null, error: rErr?.message ?? 'Rutina no encontrada' }

  const { data: days, error: dErr } = await supabase
    .from('routine_days')
    .select('id, weekday, label')
    .eq('routine_id', routineId)
    .order('weekday', { ascending: true })

  if (dErr) return { payload: null, error: dErr.message }

  const sharedDays: SharedDayPayload[] = []

  for (const day of days ?? []) {
    const { data: exercises, error: exErr } = await supabase
      .from('routine_exercises')
      .select(`
        order_index, target_sets, rep_min, rep_max,
        rir_target, rest_seconds, rest_between_exercises_seconds,
        notes, warmup_sets, is_time_based, target_time_seconds,
        exercise:exercises_catalog (id, name, muscle_group, equipment, image_url)
      `)
      .eq('routine_day_id', day.id)
      .order('order_index', { ascending: true })

    if (exErr) continue

    sharedDays.push({
      weekday: day.weekday,
      label: day.label,
      exercises: (exercises ?? []).map((e) => {
        const ex = e.exercise as unknown as ExerciseCatalogJoin
        return {
          exerciseId: ex.id,
          exerciseName: ex.name,
          muscleGroup: ex.muscle_group,
          equipment: ex.equipment ?? null,
          imageUrl: ex.image_url ?? null,
          orderIndex: e.order_index,
          targetSets: e.target_sets,
          repMin: e.rep_min,
          repMax: e.rep_max,
          rirTarget: e.rir_target,
          restSeconds: e.rest_seconds,
          restBetweenExercisesSeconds: e.rest_between_exercises_seconds,
          notes: e.notes ?? null,
          warmupSets: e.warmup_sets,
          isTimeBased: e.is_time_based ?? false,
          targetTimeSeconds: e.target_time_seconds ?? null,
        }
      }),
    })
  }

  return {
    payload: {
      version: 1,
      routineName: routine.name,
      exportedAt: new Date().toISOString(),
      days: sharedDays,
    },
    error: null,
  }
}

/* ── SUBIR SNAPSHOT A SUPABASE ───────────────────────────────── */

export async function uploadRoutineSnapshot(
  userId: string,
  payload: SharedRoutinePayload,
): Promise<{ shareId: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('shared_routines')
    .insert({
      source_user_id: userId,
      routine_name: payload.routineName,
      payload,
    })
    .select('id')
    .single()

  if (error || !data) return { shareId: null, error: error?.message ?? 'Error al subir rutina' }
  return { shareId: data.id as string, error: null }
}

/* ── DESCARGAR SNAPSHOT DE SUPABASE ─────────────────────────── */

export async function fetchRoutineSnapshot(
  shareId: string,
): Promise<{ payload: SharedRoutinePayload | null; error: string | null }> {
  const { data, error } = await supabase
    .from('shared_routines')
    .select('payload')
    .eq('id', shareId)
    .single()

  if (error || !data) return { payload: null, error: error?.message ?? 'Rutina no encontrada' }
  return { payload: data.payload as SharedRoutinePayload, error: null }
}

/* ── IMPORTAR RUTINA ─────────────────────────────────────────── */

export async function importSharedRoutine(
  userId: string,
  payload: SharedRoutinePayload,
): Promise<{ error: string | null }> {
  const { data: newRoutine, error: rErr } = await supabase
    .from('routines')
    .insert({ user_id: userId, name: payload.routineName })
    .select('id')
    .single()

  if (rErr || !newRoutine) return { error: rErr?.message ?? 'Error al crear rutina' }

  const routineId = newRoutine.id as string

  for (const day of payload.days) {
    const { data: newDay, error: dErr } = await supabase
      .from('routine_days')
      .insert({ routine_id: routineId, weekday: day.weekday, label: day.label })
      .select('id')
      .single()

    if (dErr || !newDay) continue
    const dayId = newDay.id as string

    for (const ex of day.exercises) {
      const resolvedId = await resolveExerciseId(userId, ex)
      await supabase.from('routine_exercises').insert({
        routine_day_id: dayId,
        exercise_id: resolvedId,
        order_index: ex.orderIndex,
        target_sets: ex.targetSets,
        rep_min: ex.repMin,
        rep_max: ex.repMax,
        rir_target: ex.rirTarget,
        rest_seconds: ex.restSeconds,
        rest_between_exercises_seconds: ex.restBetweenExercisesSeconds,
        notes: ex.notes,
        warmup_sets: ex.warmupSets,
        is_time_based: ex.isTimeBased ?? false,
        target_time_seconds: ex.targetTimeSeconds ?? null,
      })
    }
  }

  return { error: null }
}

/* ── RETROCOMPATIBILIDAD: decodificar QRs legacy (?r=BASE64) ── */

export function decodeBase64ToPayload(
  base64: string,
): { payload: SharedRoutinePayload | null; error: string | null } {
  try {
    const std = base64.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(escape(atob(std)))
    const parsed = JSON.parse(json) as SharedRoutinePayload
    if (!parsed.version || !parsed.routineName || !Array.isArray(parsed.days)) {
      return { payload: null, error: 'Payload inválido' }
    }
    return { payload: parsed, error: null }
  } catch {
    return { payload: null, error: 'No se pudo leer el código QR' }
  }
}

/* ── HELPERS PRIVADOS ────────────────────────────────────────── */

async function resolveExerciseId(
  userId: string,
  ex: SharedDayPayload['exercises'][number],
): Promise<string> {
  // 1. El ejercicio existe en el catálogo público/global → reusar
  const { data: found } = await supabase
    .from('exercises_catalog')
    .select('id')
    .eq('id', ex.exerciseId)
    .maybeSingle()   // maybeSingle: no lanza error si no existe

  if (found?.id) return found.id as string

  // 2. El ejercicio es personalizado (del exportador) → buscar por nombre
  //    para no duplicar si ya fue importado antes
  const { data: byName } = await supabase
    .from('exercises_catalog')
    .select('id')
    .ilike('name', ex.exerciseName)
    .eq('source', 'imported')
    .maybeSingle()

  if (byName?.id) return byName.id as string

  // 3. Clonar el ejercicio con todos los campos mínimos requeridos
  const { data: cloned, error: cloneErr } = await supabase
    .from('exercises_catalog')
    .insert({
      name: ex.exerciseName,
      muscle_group: ex.muscleGroup ?? 'general',
      equipment: ex.equipment ?? null,
      image_url: ex.imageUrl ?? null,
      source: 'imported',
      created_by: userId,
    })
    .select('id')
    .single()

  if (cloned?.id) return cloned.id as string

  // 4. Fallback final: crear placeholder mínimo garantizado
  console.error('[resolveExerciseId] clone failed:', cloneErr?.message)
  const { data: placeholder } = await supabase
    .from('exercises_catalog')
    .insert({
      name: ex.exerciseName,
      muscle_group: 'general',
      source: 'imported',
      created_by: userId,
    })
    .select('id')
    .single()

  // Si incluso el placeholder falla, retornar string vacío y dejar que
  // la UI lo maneje con el null-guard en ExerciseItem
  return (placeholder?.id ?? '') as string
}
