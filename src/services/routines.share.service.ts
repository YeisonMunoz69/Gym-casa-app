/* ============================================================
   routines.share.service.ts — Exportar e importar rutinas via payload Base64
   FASE 05.5 — GYM-YJMG
   v2: payload comprimido con pako.deflateRaw + keys minificadas.
   El QR resultante es ~70% más compacto que la versión Base64 puro.
   ============================================================ */
import { deflateRaw, inflateRaw } from 'pako'
import { supabase } from './supabase'
import type { SharedRoutinePayload, SharedDayPayload } from '../types/routine'

/* ── EXPORTAR ────────────────────────────────────────────── */

export async function exportRoutinePayload(
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
        notes, warmup_sets,
        exercise:exercises_catalog (id, name, muscle_group, equipment)
      `)
      .eq('routine_day_id', day.id)
      .order('order_index', { ascending: true })

    if (exErr) continue

    type ExerciseCatalogJoin = {
      id: string
      name: string
      muscle_group: string
      equipment: string | null
    }

    sharedDays.push({
      weekday: day.weekday,
      label: day.label,
      exercises: (exercises ?? []).map((e) => {
        const ex = e.exercise as unknown as ExerciseCatalogJoin
        return {
          exerciseId: ex.id,
          exerciseName: ex.name,
          muscleGroup: ex.muscle_group,
          equipment: ex.equipment,
          orderIndex: e.order_index,
          targetSets: e.target_sets,
          repMin: e.rep_min,
          repMax: e.rep_max,
          rirTarget: e.rir_target,
          restSeconds: e.rest_seconds,
          restBetweenExercisesSeconds: e.rest_between_exercises_seconds,
          notes: e.notes,
          warmupSets: e.warmup_sets,
        }
      }),
    })
  }

  const payload: SharedRoutinePayload = {
    version: 1,
    routineName: routine.name,
    exportedAt: new Date().toISOString(),
    days: sharedDays,
  }

  return { payload, error: null }
}

/* ─── COMPACT PAYLOAD: versión minificada para que el QR sea legible ─── */

/** Transforma un SharedRoutinePayload en un objeto ultra-compacto */
function minify(payload: SharedRoutinePayload): unknown {
  return {
    v: payload.version,
    n: payload.routineName,
    d: payload.days.map((day) => ({
      w: day.weekday,
      l: day.label,
      e: day.exercises.map((ex) => ({
        i: ex.exerciseId,
        nm: ex.exerciseName,
        mg: ex.muscleGroup,
        eq: ex.equipment ?? null,
        o: ex.orderIndex,
        ts: ex.targetSets,
        r1: ex.repMin,
        r2: ex.repMax,
        rr: ex.rirTarget,
        rs: ex.restSeconds,
        rb: ex.restBetweenExercisesSeconds,
        nt: ex.notes ?? null,
        ws: ex.warmupSets,
      })),
    })),
  }
}

/** Restaura un objeto compacto a SharedRoutinePayload */
function expand(c: any): SharedRoutinePayload {
  return {
    version: c.v ?? 1,
    routineName: c.n ?? '',
    exportedAt: new Date().toISOString(),
    days: (c.d ?? []).map((day: any) => ({
      weekday: day.w,
      label: day.l,
      exercises: (day.e ?? []).map((ex: any) => ({
        exerciseId: ex.i,
        exerciseName: ex.nm,
        muscleGroup: ex.mg,
        equipment: ex.eq,
        orderIndex: ex.o,
        targetSets: ex.ts,
        repMin: ex.r1,
        repMax: ex.r2,
        rirTarget: ex.rr,
        restSeconds: ex.rs,
        restBetweenExercisesSeconds: ex.rb,
        notes: ex.nt,
        warmupSets: ex.ws,
      })),
    })),
  }
}

/** Encode: JSON → minify → deflateRaw → Base64url (sin padding) */
export function encodePayloadToBase64(payload: SharedRoutinePayload): string {
  const json = JSON.stringify(minify(payload))
  const compressed = deflateRaw(json, { level: 9 })
  // Base64url: reemplaza +/= para que sea URL-safe sin encodeURIComponent
  return btoa(String.fromCharCode(...compressed))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** Decode: Base64url → inflateRaw → expand → SharedRoutinePayload */
export function decodeBase64ToPayload(
  base64: string,
): { payload: SharedRoutinePayload | null; error: string | null } {
  try {
    // Soporta tanto Base64url (nuevo) como Base64 estándar (legado)
    const std = base64.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(std)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

    let parsed: any
    try {
      // Intenta descomprimir (formato nuevo)
      const json = new TextDecoder().decode(inflateRaw(bytes))
      parsed = JSON.parse(json)
    } catch {
      // Fallback: intenta como JSON plano (formato legado)
      parsed = JSON.parse(decodeURIComponent(escape(atob(std))))
    }

    // Detecta si es formato compacto (tiene 'v') o expandido (tiene 'version')
    const payload = ('v' in parsed) ? expand(parsed) : parsed as SharedRoutinePayload

    if (!payload.version || !payload.routineName || !Array.isArray(payload.days)) {
      return { payload: null, error: 'Payload inválido' }
    }
    return { payload, error: null }
  } catch {
    return { payload: null, error: 'No se pudo leer el código QR' }
  }
}

/* ── IMPORTAR ────────────────────────────────────────────── */

export async function importSharedRoutine(
  userId: string,
  payload: SharedRoutinePayload,
): Promise<{ error: string | null }> {
  // 1. Crear la rutina nueva del receptor
  const { data: newRoutine, error: rErr } = await supabase
    .from('routines')
    .insert({ user_id: userId, name: payload.routineName })
    .select('id')
    .single()

  if (rErr || !newRoutine) return { error: rErr?.message ?? 'Error al crear rutina' }

  const routineId = newRoutine.id as string

  for (const day of payload.days) {
    // 2. Crear el día
    const { data: newDay, error: dErr } = await supabase
      .from('routine_days')
      .insert({ routine_id: routineId, weekday: day.weekday, label: day.label })
      .select('id')
      .single()

    if (dErr || !newDay) continue

    const dayId = newDay.id as string

    for (const ex of day.exercises) {
      // 3. Verificar que el ejercicio existe en el catálogo
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
      })
    }
  }

  return { error: null }
}

/** Resuelve el ID del ejercicio en el catálogo del receptor.
 *  Si no existe, lo clona con source='imported'. */
async function resolveExerciseId(
  userId: string,
  ex: SharedDayPayload['exercises'][number],
): Promise<string> {
  // Intentar encontrar por ID exacto (catálogo global)
  const { data: found } = await supabase
    .from('exercises_catalog')
    .select('id')
    .eq('id', ex.exerciseId)
    .single()

  if (found) return found.id as string

  // Clonar como ejercicio importado del usuario
  const { data: cloned } = await supabase
    .from('exercises_catalog')
    .insert({
      name: ex.exerciseName,
      muscle_group: ex.muscleGroup,
      equipment: ex.equipment,
      source: 'imported',
      created_by: userId,
    })
    .select('id')
    .single()

  return (cloned?.id ?? ex.exerciseId) as string
}
