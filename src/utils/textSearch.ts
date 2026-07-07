/** Quita tildes/diacriticos y normaliza mayusculas/espacios para comparar
 *  texto sin que "Busqueda" (con tilde) y "busqueda" cuenten como distintos. */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** true si cada palabra de `query` aparece como substring en `text`
 *  (sin importar tildes, mayusculas ni el orden de las palabras) —
 *  asi "banca press" encuentra "Press de banca con mancuernas", y
 *  recordar una sola palabra del nombre alcanza para encontrarlo. */
export function matchesSearchQuery(text: string, query: string): boolean {
  const normalizedQuery = normalizeForSearch(query)
  if (!normalizedQuery) return true

  const normalizedText = normalizeForSearch(text)
  const words = normalizedQuery.split(/\s+/).filter(Boolean)
  return words.every((word) => normalizedText.includes(word))
}
