/* ============================================================
   quotes.service.ts — Lectura de frases motivacionales del día
   FASE 04 — GYM-YJMG
   Tabla `daily_quotes` ya tiene 5 seeds en BD.

   Schema real (001_new_features.sql):
     id, quote_text, author, category, quote_date, created_at
     UNIQUE (quote_date) — una frase por fecha de calendario

   Estrategia: buscar la frase cuyo quote_date sea hoy,
   si no existe, tomar la más reciente disponible.
   ============================================================ */
import { supabase } from './supabase'

export type DailyQuote = {
  id: string
  quote_text: string
  author: string | null
}

/** Obtiene la frase del día.
 *  Primero intenta la del día actual; si no hay, toma la más reciente. */
export async function getDailyQuote(): Promise<{ data: DailyQuote | null; error: string | null }> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // Intento 1: frase exacta de hoy
  const { data: todayData, error: todayErr } = await supabase
    .from('daily_quotes')
    .select('id, quote_text, author')
    .eq('quote_date', today)
    .maybeSingle()

  if (!todayErr && todayData) {
    return { data: todayData as DailyQuote, error: null }
  }

  // Intento 2: cualquier frase disponible (ordenada por quote_date desc)
  const { data: fallback, error: fbErr } = await supabase
    .from('daily_quotes')
    .select('id, quote_text, author')
    .order('quote_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fbErr || !fallback) {
    return { data: null, error: fbErr?.message ?? 'Sin frases disponibles' }
  }

  return { data: fallback as DailyQuote, error: null }
}
