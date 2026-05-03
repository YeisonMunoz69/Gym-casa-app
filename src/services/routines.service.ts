import { supabase } from './supabase'
import type {
  RoutineRow,
  RoutineWithDays,
  RoutineDayRow,
  RoutineExerciseRow,
  RoutineExerciseWithDetails,
} from '../types/routine'

/* ---- Routines ---- */

export async function loadRoutinesWithDays(
  userId: string,
): Promise<{ data: RoutineWithDays[]; error: string | null }> {
  const { data, error } = await supabase
    .from('routines')
    .select('*, routine_days(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: data as RoutineWithDays[], error: null }
}

export async function createRoutine(
  userId: string,
  name: string,
): Promise<{ data: RoutineRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('routines')
    .insert({ user_id: userId, name })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as RoutineRow, error: null }
}

export async function deleteRoutine(
  routineId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('routines')
    .delete()
    .eq('id', routineId)

  return { error: error?.message ?? null }
}

export async function toggleRoutineActive(
  routineId: string,
  isActive: boolean,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('routines')
    .update({ is_active: isActive })
    .eq('id', routineId)

  return { error: error?.message ?? null }
}

export async function renameRoutine(
  routineId: string,
  name: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('routines')
    .update({ name: name.trim() })
    .eq('id', routineId)

  return { error: error?.message ?? null }
}

export async function duplicateRoutine(
  userId: string,
  routineId: string,
  newName: string,
): Promise<{ error: string | null }> {
  // 1. Leer dias de la rutina original
  const { data: sourceDays, error: daysErr } = await supabase
    .from('routine_days')
    .select('id, weekday, label')
    .eq('routine_id', routineId)
    .order('weekday', { ascending: true })

  if (daysErr) return { error: daysErr.message }

  // 2. Crear la nueva rutina (inactiva por defecto)
  const { data: newRoutine, error: routineErr } = await supabase
    .from('routines')
    .insert({ user_id: userId, name: newName.trim(), is_active: false })
    .select('id')
    .single()

  if (routineErr || !newRoutine) return { error: routineErr?.message ?? 'Error creando rutina' }

  // 3. Copiar dias y ejercicios secuencialmente
  for (const sourceDay of sourceDays ?? []) {
    const { data: newDay, error: dayErr } = await supabase
      .from('routine_days')
      .insert({ routine_id: newRoutine.id, weekday: sourceDay.weekday, label: sourceDay.label })
      .select('id')
      .single()

    if (dayErr || !newDay) continue

    const { data: exercises } = await supabase
      .from('routine_exercises')
      .select('exercise_id, order_index, target_sets, rep_min, rep_max, rir_target, rest_seconds, rest_between_exercises_seconds, display_name, image_url, video_url')
      .eq('routine_day_id', sourceDay.id)
      .order('order_index', { ascending: true })

    if (!exercises || exercises.length === 0) continue

    await supabase.from('routine_exercises').insert(
      exercises.map((ex, idx) => ({
        routine_day_id: newDay.id,
        exercise_id: ex.exercise_id,
        order_index: idx,
        target_sets: ex.target_sets,
        rep_min: ex.rep_min,
        rep_max: ex.rep_max,
        rir_target: ex.rir_target,
        rest_seconds: ex.rest_seconds,
        rest_between_exercises_seconds: ex.rest_between_exercises_seconds,
        display_name: ex.display_name,
        image_url: ex.image_url,
        video_url: ex.video_url,
      })),
    )
  }

  return { error: null }
}


/* ---- Routine Days ---- */

export async function addRoutineDay(
  routineId: string,
  weekday: number,
  label?: string,
): Promise<{ data: RoutineDayRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('routine_days')
    .insert({ routine_id: routineId, weekday, label })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as RoutineDayRow, error: null }
}

export async function removeRoutineDay(
  dayId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('routine_days')
    .delete()
    .eq('id', dayId)

  return { error: error?.message ?? null }
}

/* ---- Routine Exercises ---- */

export async function loadDayExercises(
  dayId: string,
): Promise<{ data: RoutineExerciseWithDetails[]; error: string | null }> {
  const { data, error } = await supabase
    .from('routine_exercises')
    .select(`
      *,
      exercise:exercises_catalog (
        id, name, muscle_group, equipment, image_url
      )
    `)
    .eq('routine_day_id', dayId)
    .order('order_index', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: data as RoutineExerciseWithDetails[], error: null }
}

export async function addExerciseToDay(
  dayId: string,
  exerciseId: string,
  orderIndex: number,
): Promise<{ data: RoutineExerciseRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('routine_exercises')
    .insert({
      routine_day_id: dayId,
      exercise_id: exerciseId,
      order_index: orderIndex,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as RoutineExerciseRow, error: null }
}

export async function addExerciseToMultipleDays(
  dayIds: string[],
  exerciseId: string,
): Promise<{ error: string | null }> {
  for (const dayId of dayIds) {
    const { data: currentExercises } = await supabase
      .from('routine_exercises')
      .select('order_index')
      .eq('routine_day_id', dayId)
    
    const maxOrder = currentExercises?.length ? Math.max(...currentExercises.map(e => e.order_index)) : -1
    
    const { error } = await supabase
      .from('routine_exercises')
      .insert({
        routine_day_id: dayId,
        exercise_id: exerciseId,
        order_index: maxOrder + 1
      })

    if (error) return { error: error.message }
  }
  return { error: null }
}

export async function removeExerciseFromDay(
  exerciseRowId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('routine_exercises')
    .delete()
    .eq('id', exerciseRowId)

  return { error: error?.message ?? null }
}

export async function updateExerciseParams(
  exerciseRowId: string,
  params: Partial<RoutineExerciseRow>,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('routine_exercises')
    .update(params)
    .eq('id', exerciseRowId)

  return { error: error?.message ?? null }
}

export async function reorderDayExercises(
  updates: Array<{ id: string; order_index: number }>,
): Promise<{ error: string | null }> {
  for (const update of updates) {
    const { error } = await supabase
      .from('routine_exercises')
      .update({ order_index: update.order_index })
      .eq('id', update.id)

    if (error) return { error: error.message }
  }
  return { error: null }
}
