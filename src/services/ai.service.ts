/* ============================================================
   ai.service.ts — Servicio de IA con Google Gemini
   FASE 06 — GYM-YJMG
   Usa fetch directo a la REST API (sin dependencia npm adicional).
   Modelo: gemini-2.0-flash-lite (el más eficiente de Gemini 2.0).
   Responsabilidad única: generar texto motivacional desde métricas.
   ============================================================ */

/** Mensaje del chat — igual que el formato de la Gemini API */
export type ChatMessage = {
  role: 'user' | 'model'
  text: string
}

const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview'
const GEMINI_BASE   = 'https://generativelanguage.googleapis.com/v1beta/models'

function getApiKey(): string | null {
  return import.meta.env.VITE_GEMINI_API_KEY ?? null
}

type MotivationContext = {
  durationSeconds: number
  totalVolume: number
  muscleGroup: string
  withBonus: boolean
}

function buildMotivationPrompt(ctx: MotivationContext): string {
  const minutes   = Math.round(ctx.durationSeconds / 60)
  const volumeKg  = Math.round(ctx.totalVolume)
  const bonusLine = ctx.withBonus
    ? 'Ademas completo un ejercicio bonus adicional despues de su rutina principal.'
    : ''

  return `
Eres el entrenador personal de la app Fitness Casa. El usuario acaba de terminar su entrenamiento con estos datos:
- Duracion: ${minutes} minutos
- Volumen total levantado: ${volumeKg} kg
- Grupo muscular trabajado: ${ctx.muscleGroup}
${bonusLine}

Escribe UN mensaje motivacional corto (maximo 2 frases). Debe:
- Ser directo, potente y en espanol.
- NO usar emojis ni caracteres especiales.
- Mencionar alguno de los datos del entrenamiento de forma natural.
- Transmitir orgullo real, no frases genericas.

Solo devuelve el mensaje. Sin comillas. Sin explicaciones.
`.trim()
}

/** Genera un mensaje motivacional personalizado con Gemini.
 *  Retorna null si la clave no está configurada o la llamada falla. */
export async function generateMotivation(ctx: MotivationContext): Promise<string | null> {
  const apiKey = getApiKey()
  if (!apiKey) return null

  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  try {
    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildMotivationPrompt(ctx) }] }],
        generationConfig: {
          temperature:     0.85,
          maxOutputTokens: 120,
          topP:            0.9,
        },
      }),
    })

    if (!response.ok) return null

    const json = await response.json()
    const text: string | undefined =
      json?.candidates?.[0]?.content?.parts?.[0]?.text

    return text?.trim() ?? null
  } catch {
    return null
  }
}

// ──────────────────────────────────────────
// Frase del día con caché diario en localStorage
// ──────────────────────────────────────────

const QUOTE_CACHE_KEY   = 'gym_ai_daily_quote'
const QUOTE_TTL_MS      = 12 * 60 * 60 * 1000   // 12 horas en milisegundos

type QuoteCache = { timestamp: number; text: string }

function buildQuotePrompt(): string {
  return `
Eres un entrenador de fitness experto. Escribe UNA frase motivacional corta para el día de hoy.
Debe:
- Estar en espanol.
- Tener entre 10 y 20 palabras.
- Inspirar a entrenar y ser constante.
- NO usar emojis ni caracteres especiales.
- NO incluir comillas.
Solo devuelve la frase. Sin explicaciones.
`.trim()
}

/** Genera la frase del día con Gemini. Caché de 12h en localStorage.
 *  Retorna null si la clave no está configurada o la llamada falla. */
export async function generateDailyQuote(): Promise<string | null> {
  const apiKey = getApiKey()
  if (!apiKey) return null

  // Revisar caché — válido por 12 horas
  try {
    const cached = localStorage.getItem(QUOTE_CACHE_KEY)
    if (cached) {
      const { timestamp, text } = JSON.parse(cached) as QuoteCache
      if (Date.now() - timestamp < QUOTE_TTL_MS) return text
    }
  } catch { /* localStorage no disponible */ }

  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  try {
    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildQuotePrompt() }] }],
        generationConfig: { temperature: 1.0, maxOutputTokens: 60 },
      }),
    })

    if (!response.ok) return null

    const json = await response.json()
    const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text?.trim()) return null

    try {
      localStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), text: text.trim() }))
    } catch { /* silencioso */ }

    return text.trim()
  } catch {
    return null
  }
}

// ──────────────────────────────────────────
// Chat multi-turn con contexto del usuario
// ──────────────────────────────────────────

/**
 * Envía el historial completo de la conversación a Gemini y retorna
 * la respuesta del modelo. El systemPrompt se inyecta como
 * systemInstruction para que Gemini conozca el contexto del atleta.
 */
export async function generateChat(
  messages: ChatMessage[],
  systemPrompt: string,
): Promise<string | null> {
  const apiKey = getApiKey()
  if (!apiKey || messages.length === 0) return null

  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  // Convertir el historial al formato de la API de Gemini
  const contents = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }))

  try {
    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature:     0.8,
          maxOutputTokens: 400,
          topP:            0.9,
        },
      }),
    })

    if (!response.ok) return null

    const json = await response.json()
    const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text
    return text?.trim() ?? null
  } catch {
    return null
  }
}
