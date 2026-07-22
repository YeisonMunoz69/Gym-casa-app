/* ============================================================
   routines.export.service.ts — Servicio de exportación a archivo (Markdown)
   FASE 05.5 — GYM-YJMG
   Responsabilidad: obtener payload de rutina y disparar descarga en .md.
   Límite: 150 líneas — SKILL-CODE §2.4 (y max 40 líneas por función)
   ============================================================ */
import { buildRoutinePayload } from './routines.share.service'
import { formatRoutineToMarkdown, downloadTextFile, sanitizeFilename } from '../utils/routineMarkdown'

/** Construye la rutina en formato legible y dispara su descarga */
export async function exportRoutineAsMarkdown(
  routineId: string,
  userId: string,
): Promise<{ error: string | null }> {
  const { payload, error } = await buildRoutinePayload(routineId, userId)
  if (error || !payload) {
    return { error: error ?? 'Error al leer los datos de la rutina' }
  }

  try {
    const markdownText = formatRoutineToMarkdown(payload)
    const filename = sanitizeFilename(payload.routineName)
    downloadTextFile(filename, markdownText)
    return { error: null }
  } catch (err) {
    console.error('[exportRoutineAsMarkdown] error generando descarga:', err)
    return { error: 'Error al generar el archivo descargable' }
  }
}
