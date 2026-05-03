/* ============================================================
   useQuoteVisibility.ts — Preferencia de frase del día
   FASE 06 — GYM-YJMG (Migrado a BD)
   Lee/escribe desde useSettings → Supabase.
   Mantiene compatibilidad de interfaz para no tocar consumidores.
   ============================================================ */
import { useCallback } from 'react'
import { useSettings } from '../../settings/hooks/useSettings'

export function useQuoteVisibility() {
  const { settings, updateSettings } = useSettings()

  const showQuote = settings?.show_daily_quote ?? true

  const setShowQuote = useCallback(
    (value: boolean) => {
      updateSettings({ show_daily_quote: value })
    },
    [updateSettings],
  )

  return { showQuote, setShowQuote }
}
