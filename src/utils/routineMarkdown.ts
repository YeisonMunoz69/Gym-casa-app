/* ============================================================
   routineMarkdown.ts — Formateador y descargador de rutina en .md
   FASE 05.5 — GYM-YJMG
   Responsabilidad: transformar payload de rutina a Markdown y descargarlo.
   Límite: 150 líneas — SKILL-CODE §2.4 (y max 40 líneas por función)
   ============================================================ */
import type { SharedRoutinePayload, SharedDayPayload, SharedExercisePayload } from '../types/routine'
import { WEEKDAY_LABELS } from '../types/routine'
import { toSpanishMuscle } from './muscleGroupLabels'

/** Formatea un ejercicio en bloque de Markdown */
function formatExerciseMarkdown(ex: SharedExercisePayload, index: number): string {
  const muscle = toSpanishMuscle(ex.muscleGroup)
  const equip = ex.equipment ? ex.equipment : 'Sin equipamiento'
  const setsStr = ex.warmupSets > 0
    ? `${ex.targetSets} series efectivas (+ ${ex.warmupSets} de calentamiento)`
    : `${ex.targetSets} series efectivas`

  let repsStr = `${ex.repMin} - ${ex.repMax} reps`
  if (ex.isTimeBased && ex.targetTimeSeconds) {
    repsStr = `${ex.targetTimeSeconds} segundos`
  } else if (ex.repMin === ex.repMax) {
    repsStr = `${ex.repMin} reps`
  }

  const lines = [
    `### ${index}. ${ex.exerciseName}`,
    `- **Grupo muscular:** ${muscle} | **Equipaje:** ${equip}`,
    `- **Series:** ${setsStr}`,
    `- **Repeticiones / Objetivo:** ${repsStr} (RIR objetivo: ${ex.rirTarget})`,
    `- **Descanso:** ${ex.restSeconds}s entre series (${ex.restBetweenExercisesSeconds}s antes del siguiente)`,
  ]
  if (ex.notes) {
    lines.push(`- **Notas:** ${ex.notes}`)
  }
  return lines.join('\n')
}

/** Formatea los ejercicios y sección de un día en Markdown */
function formatDayMarkdown(day: SharedDayPayload): string {
  const dayName = WEEKDAY_LABELS[day.weekday] ?? `Día ${day.weekday}`
  const title = day.label ? `${dayName} — ${day.label}` : dayName
  const header = `## 🗓️ ${title}\n*(${day.exercises.length} ejercicio${day.exercises.length === 1 ? '' : 's'})*\n`

  if (day.exercises.length === 0) {
    return `${header}\n*Sin ejercicios asignados en este día.*\n`
  }

  const sortedExercises = [...day.exercises].sort((a, b) => a.orderIndex - b.orderIndex)
  const exercisesMd = sortedExercises.map((ex, idx) => formatExerciseMarkdown(ex, idx + 1)).join('\n\n')
  return `${header}\n${exercisesMd}\n`
}

/** Convierte el payload completo de la rutina en documento Markdown (.md) */
export function formatRoutineToMarkdown(payload: SharedRoutinePayload): string {
  let dateStr = payload.exportedAt
  try {
    dateStr = new Date(payload.exportedAt).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    // Si falla el parseo de fecha, se deja original
  }

  const header = `# 💪 Rutina: ${payload.routineName}\n**Exportada el:** ${dateStr}\n\n---\n`

  if (!payload.days || payload.days.length === 0) {
    return `${header}\n*Esta rutina aún no tiene días configurados.*\n`
  }

  const sortedDays = [...payload.days].sort((a, b) => a.weekday - b.weekday)
  const daysMd = sortedDays.map(formatDayMarkdown).join('\n---\n\n')
  return `${header}\n${daysMd}`
}

/** Genera un nombre de archivo limpio y seguro para descargar (.md) */
export function sanitizeFilename(name: string): string {
  const clean = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `rutina-${clean || 'entrenamiento'}.md`
}

/** Dispara la descarga del archivo de texto en el navegador */
export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.md') ? filename : `${filename}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
