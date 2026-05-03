/* ============================================================
   DailyQuote.tsx — Frase motivacional del día
   FASE 06 update — GYM-YJMG
   Intenta Gemini primero (caché diario). Fallback: daily_quotes en BD.
   Sin emojis (SKILL-CODE §5.4).
   ============================================================ */
import { useEffect, useState } from 'react'
import { Quote } from 'lucide-react'
import { getDailyQuote } from '../../../services/quotes.service'
import { generateDailyQuote } from '../../../services/ai.service'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import './DailyQuote.css'

type QuoteState = { text: string; author?: string }

export function DailyQuote() {
  const [quote, setQuote] = useState<QuoteState | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function fetchQuote() {
      // 1. Intentar con Gemini (caché de 1 día)
      const aiText = await generateDailyQuote()
      if (aiText) {
        setQuote({ text: aiText })
        setLoading(false)
        return
      }

      // 2. Fallback: tabla daily_quotes de Supabase
      const { data } = await getDailyQuote()
      if (data) {
        setQuote({ text: data.quote_text, author: data.author ?? undefined })
      }
      setLoading(false)
    }

    fetchQuote()
  }, [])

  if (loading) {
    return (
      <div className="daily-quote daily-quote--loading">
        <HamsterLoader size={36} />
      </div>
    )
  }

  if (!quote) return null

  return (
    <blockquote className="daily-quote">
      <Quote size={20} className="daily-quote__icon" aria-hidden="true" />
      <p className="daily-quote__text">{quote.text}</p>
      {quote.author && (
        <footer className="daily-quote__author">— {quote.author}</footer>
      )}
    </blockquote>
  )
}
