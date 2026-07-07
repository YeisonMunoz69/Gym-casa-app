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
  // Espalda (genérico — ejercicios etiquetados antes de separar alta/baja)
  back: 'Espalda', espalda: 'Espalda', lats: 'Espalda',
  // Espalda Alta / Baja (categorías finas nuevas)
  upper_back: 'Espalda Alta', 'espalda alta': 'Espalda Alta',
  lower_back: 'Espalda Baja', 'espalda baja': 'Espalda Baja', lumbar: 'Espalda Baja',
  // Trapecio
  traps: 'Trapecio', trapezius: 'Trapecio', trapecio: 'Trapecio',
  // Hombros
  shoulders: 'Hombros', deltoids: 'Hombros', hombros: 'Hombros', hombro: 'Hombros',
  // Bíceps
  biceps: 'Biceps', bicep: 'Biceps', 'bíceps': 'Biceps',
  // Tríceps
  triceps: 'Triceps', tricep: 'Triceps', 'tríceps': 'Triceps',
  // Piernas (genérico — ejercicios etiquetados antes de separar cuadriceps/femorales)
  legs: 'Piernas', piernas: 'Piernas', pierna: 'Piernas',
  // Cuadriceps / Femorales (categorías finas nuevas)
  quads: 'Cuadriceps', quadriceps: 'Cuadriceps', cuadriceps: 'Cuadriceps', 'cuádriceps': 'Cuadriceps',
  hamstrings: 'Femorales', femorales: 'Femorales',
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
  // Estiramiento
  estiramiento: 'Estiramiento', stretching: 'Estiramiento', stretch: 'Estiramiento', flexibility: 'Estiramiento', movilidad: 'Estiramiento', mobility: 'Estiramiento',
  // Otros
  arms: 'Brazos',
}

/** Devuelve la etiqueta en español para un valor interno de muscle_group */
export function toSpanishMuscle(raw: string): string {
  const key = raw.toLowerCase().trim()
  return RAW_TO_ES[key] ?? raw   // Si no hay mapeo, devuelve el original
}

/** Lista canónica de grupos musculares para selects y filtros.
 *  'Piernas' y 'Espalda' se conservan por compatibilidad con ejercicios
 *  ya etiquetados así — las categorías finas son opcionales, para
 *  etiquetar ejercicios nuevos (o reetiquetar los viejos) con precisión. */
export const MUSCLE_GROUP_OPTIONS = [
  'Pecho',
  'Espalda',
  'Espalda Alta',
  'Espalda Baja',
  'Trapecio',
  'Hombros',
  'Biceps',
  'Triceps',
  'Antebrazos',
  'Piernas',
  'Cuadriceps',
  'Femorales',
  'Gluteos',
  'Abdomen',
  'Pantorrilla',
  'Cuello',
  'Cardio',
  'Cuerpo Completo',
  'Estiramiento',
  'Bonificacion',
] as const

export type MuscleGroupOption = (typeof MUSCLE_GROUP_OPTIONS)[number]

/** Grupos musculares con alias es/en para chips de filtro (catálogo de
 *  ejercicios). Antes duplicado idéntico en CatalogScreen.tsx y
 *  AddExerciseSheet.tsx — consolidado aquí como fuente única. */
export const MUSCLE_GROUP_FILTERS: { label: string; values: string[] }[] = [
  { label: 'Pecho',         values: ['pecho', 'chest'] },
  { label: 'Espalda',       values: ['espalda', 'back', 'lats'] },
  { label: 'Espalda Alta',  values: ['espalda alta', 'upper_back', 'upper back'] },
  { label: 'Espalda Baja',  values: ['espalda baja', 'lower_back', 'lower back', 'lumbar'] },
  { label: 'Trapecio',      values: ['trapecio', 'traps', 'trapezius'] },
  { label: 'Hombros',       values: ['hombros', 'shoulders', 'deltoids'] },
  { label: 'Biceps',        values: ['biceps', 'bicep'] },
  { label: 'Triceps',       values: ['triceps', 'tricep'] },
  { label: 'Antebrazos',    values: ['antebrazos', 'forearms'] },
  { label: 'Piernas',       values: ['piernas', 'legs', 'pierna'] },
  { label: 'Cuadriceps',    values: ['cuadriceps', 'cuádriceps', 'quads', 'quadriceps'] },
  { label: 'Femorales',     values: ['femorales', 'hamstrings'] },
  { label: 'Gluteos',       values: ['gluteos', 'glutes'] },
  { label: 'Abdomen',       values: ['abdomen', 'abs', 'abdominales', 'core'] },
  { label: 'Pantorrilla',   values: ['pantorrilla', 'calves'] },
  { label: 'Cuello',        values: ['cuello', 'neck'] },
  { label: 'Cardio',        values: ['cardio'] },
  { label: 'Cuerpo Completo', values: ['cuerpo completo', 'full body'] },
  { label: 'Estiramiento',  values: ['estiramiento', 'stretching', 'stretch', 'flexibility', 'movilidad', 'mobility'] },
  { label: 'Bonificacion',  values: ['bonificacion', 'bonificación'] },
]
