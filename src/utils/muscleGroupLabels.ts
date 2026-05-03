/* ============================================================
   muscleGroupLabels.ts — Mapa canónico de grupos musculares
   FASE 06 — GYM-YJMG
   Fuente única de verdad para la presentación en español.
   Internamente la BD puede tener valores en inglés o español;
   este mapa los normaliza para la UI.
   ============================================================ */

/** Convierte cualquier valor interno de muscle_group al español de la UI */
const RAW_TO_ES: Record<string, string> = {
  // Pecho
  chest: 'Pecho', pecho: 'Pecho',
  // Espalda
  back: 'Espalda', espalda: 'Espalda', lats: 'Espalda',
  // Trapecio
  traps: 'Trapecio', trapezius: 'Trapecio', trapecio: 'Trapecio',
  // Hombros
  shoulders: 'Hombros', deltoids: 'Hombros', hombros: 'Hombros', hombro: 'Hombros',
  // Bíceps
  biceps: 'Biceps', bicep: 'Biceps', 'bíceps': 'Biceps',
  // Tríceps
  triceps: 'Triceps', tricep: 'Triceps', 'tríceps': 'Triceps',
  // Piernas
  legs: 'Piernas', piernas: 'Piernas', pierna: 'Piernas',
  quads: 'Piernas', quadriceps: 'Piernas', hamstrings: 'Piernas',
  // Glúteos
  glutes: 'Gluteos', gluteos: 'Gluteos',
  // Abdomen
  abs: 'Abdomen', abdomen: 'Abdomen', core: 'Abdomen',
  abdominales: 'Abdomen',
  // Pantorrilla
  calves: 'Pantorrilla', pantorrilla: 'Pantorrilla', soleus: 'Pantorrilla',
  // Antebrazos
  forearms: 'Antebrazos', antebrazos: 'Antebrazos', antebrazo: 'Antebrazos',
  brachialis: 'Biceps',
  // Cuello
  neck: 'Cuello', cuello: 'Cuello',
  // Cardio / Cuerpo completo
  cardio: 'Cardio',
  'cuerpo completo': 'Cuerpo Completo', 'full body': 'Cuerpo Completo',
  // Bonificación
  bonificacion: 'Bonificacion', 'bonificación': 'Bonificacion',
  // Otros
  arms: 'Brazos',
}

/** Devuelve la etiqueta en español para un valor interno de muscle_group */
export function toSpanishMuscle(raw: string): string {
  const key = raw.toLowerCase().trim()
  return RAW_TO_ES[key] ?? raw   // Si no hay mapeo, devuelve el original
}

/** Lista canónica de grupos musculares para selects y filtros */
export const MUSCLE_GROUP_OPTIONS = [
  'Pecho',
  'Espalda',
  'Trapecio',
  'Hombros',
  'Biceps',
  'Triceps',
  'Antebrazos',
  'Piernas',
  'Gluteos',
  'Abdomen',
  'Pantorrilla',
  'Cuello',
  'Cardio',
  'Cuerpo Completo',
] as const

export type MuscleGroupOption = (typeof MUSCLE_GROUP_OPTIONS)[number]
