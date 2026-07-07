/* ============================================================
   useExerciseSearch.ts — Búsqueda de ejercicios del catálogo
   FIX (2026-07): antes filtraba con ILIKE en Postgres, que NO
   ignora tildes ("Búsqueda" no encontraba "busqueda") y solo
   hacía substring exacto de la frase completa. Ahora se trae el
   catálogo completo una vez y se filtra en el cliente con
   matchesSearchQuery (utils/textSearch.ts): ignora tildes/mayúsculas
   y encuentra coincidencias por palabra suelta, sin importar el
   orden — así con recordar una sola palabra del nombre alcanza.
   Compartido por CatalogScreen (Ejercicios) y AddExerciseSheet
   (Rutinas) — el mismo fix aplica a ambas pantallas.
   ============================================================ */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { loadExercisesCatalog } from '../../../services/exercises.service'
import { matchesSearchQuery } from '../../../utils/textSearch'
import type { ExerciseCatalogRow } from '../../../types/exercise'

type UseExerciseSearchReturn = {
  /** All results from DB (not paginated) */
  allResults: ExerciseCatalogRow[]
  query: string
  loading: boolean
  setQuery: (q: string) => void
  reload: () => void
}

export function useExerciseSearch(): UseExerciseSearchReturn {
  const [catalog, setCatalog] = useState<ExerciseCatalogRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await loadExercisesCatalog()
    setCatalog(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const allResults = useMemo(
    () => catalog.filter((exercise) => matchesSearchQuery(exercise.name, query)),
    [catalog, query],
  )

  return { allResults, query, loading, setQuery, reload: load }
}
