/* ============================================================
   routines.share.service.ts — Exportar e importar rutinas via Supabase snapshots
   FASE 05.5 v3 — GYM-YJMG
   Arquitectura: snapshot JSON en tabla shared_routines → URL corta ?share=UUID
   Retrocompatibilidad: decodeBase64ToPayload para QRs legacy (?r=BASE64)
   Límite: 150 líneas — SKILL-CODE §2.4
   ============================================================ */
import { supabase } from './supabase'
import { getUserExerciseVideosBulk, getUserExerciseVideo, saveUserExerciseVideo } from './exercise-videos.service'
import type { SharedRoutinePayload, SharedDayPayload } from '../types/routine'

/* ── TIPOS INTERNOS ─────────────────────────────────────────── */

type ExerciseCatalogJoin = {
  id: string
  name: string
  muscle_group: string
  equipment: string | null
  image_url: string | null
  user_id: string | null  /* null = ejercicio global, UUID = personalizado */
}

/* ── CONSTRUIR PAYLOAD COMPLETO ──────────────────────────────── */

export async function buildRoutinePayload(
  routineId: string,
  userId: string,
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

    const dayExerciseIds = (exercises ?? []).map((e) => (e.exercise as unknown as ExerciseCatalogJoin).id)
    const videosByExerciseId = await getUserExerciseVideosBulk(userId, dayExerciseIds)

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
          suggestedVideoUrl: videosByExerciseId[ex.id] ?? null,
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
  const failedExercises: string[] = []

  for (const day of payload.days) {
    const { data: newDay, error: dErr } = await supabase
      .from('routine_days')
      .insert({ routine_id: routineId, weekday: day.weekday, label: day.label ?? null })
      .select('id')
      .single()

    if (dErr || !newDay) {
      console.error('[importSharedRoutine] día fallido:', dErr?.message)
      continue
    }
    const dayId = newDay.id as string

    for (const ex of day.exercises) {
      // Saltar si no se pudo resolver el ejercicio
      const resolvedId = await resolveExerciseId(userId, ex)
      if (!resolvedId) {
        failedExercises.push(ex.exerciseName)
        continue
      }

      // Aplicar defaults seguros en todos los campos numéricos
      // para evitar rechazos por NOT NULL en la BD
      const { error: exErr } = await supabase.from('routine_exercises').insert({
        routine_day_id: dayId,
        exercise_id:    resolvedId,
        order_index:    ex.orderIndex    ?? 0,
        target_sets:    ex.targetSets    ?? 3,
        rep_min:        ex.repMin        ?? 8,
        rep_max:        ex.repMax        ?? 12,
        rir_target:     ex.rirTarget     ?? 2,
        rest_seconds:   ex.restSeconds   ?? 90,
        rest_between_exercises_seconds: ex.restBetweenExercisesSeconds ?? 60,
        notes:          ex.notes         ?? null,
        warmup_sets:    ex.warmupSets    ?? 0,
        is_time_based:  ex.isTimeBased   ?? false,
        target_time_seconds: ex.targetTimeSeconds ?? null,
      })

      if (exErr) {
        console.error('[importSharedRoutine] ejercicio fallido:', ex.exerciseName, exErr.message)
        failedExercises.push(ex.exerciseName)
        continue
      }

      // Siembra el video sugerido del que comparte, solo si el importador
      // todavía no tiene su propio video para este ejercicio — nunca pisa
      // una preferencia ya existente.
      if (ex.suggestedVideoUrl) {
        const existing = await getUserExerciseVideo(userId, resolvedId)
        if (!existing) {
          await saveUserExerciseVideo(userId, resolvedId, ex.suggestedVideoUrl)
        }
      }
    }
  }

  if (failedExercises.length > 0) {
    console.warn('[importSharedRoutine] ejercicios no importados:', failedExercises)
    // Retornar éxito parcial — la rutina se creó pero con advertencia
    return { error: null }
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
  // 1. El ejercicio existe en el catálogo global (user_id = null) → todos pueden leerlo y reusarlo
  const { data: globalEx } = await supabase
    .from('exercises_catalog')
    .select('id')
    .eq('id', ex.exerciseId)
    .is('user_id', null)       // Solo buscar en el catálogo global
    .maybeSingle()

  if (globalEx?.id) return globalEx.id as string

  // 2. El ejercicio es personalizado del exportador → comprobar si el importador
  //    ya lo tiene (mismo nombre, mismo user_id del importador)
  const { data: ownEx } = await supabase
    .from('exercises_catalog')
    .select('id')
    .ilike('name', ex.exerciseName)
    .eq('user_id', userId)
    .maybeSingle()

  if (ownEx?.id) return ownEx.id as string

  // 3. Clonar el ejercicio para el usuario importador
  //    Schema real: user_id (no created_by), sin columna source
  const { data: cloned, error: cloneErr } = await supabase
    .from('exercises_catalog')
    .insert({
      name:          ex.exerciseName,
      muscle_group:  ex.muscleGroup  ?? 'general',
      equipment:     ex.equipment    ?? null,
      image_url:     ex.imageUrl     ?? null,
      user_id:       userId,          // Asignar al usuario importador
    })
    .select('id')
    .single()

  if (cloned?.id) return cloned.id as string

  // 4. Fallback: intentar con los mínimos absolutos (name + user_id)
  console.error('[resolveExerciseId] clon fallido:', cloneErr?.message, '| ejercicio:', ex.exerciseName)
  const { data: placeholder } = await supabase
    .from('exercises_catalog')
    .insert({
      name:         ex.exerciseName,
      muscle_group: 'general',
      user_id:      userId,
    })
    .select('id')
    .single()

  return (placeholder?.id ?? '') as string
}
