import { useState, useEffect, useCallback } from 'react'
import { searchExercises } from '../../../services/exercises.service'
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
  const [allResults, setAllResults] = useState<ExerciseCatalogRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const search = useCallback(async () => {
    setLoading(true)
    const { data } = await searchExercises(query)
    setAllResults(data)
    setLoading(false)
  }, [query])

  useEffect(() => {
    const timeout = setTimeout(search, 300)
    return () => clearTimeout(timeout)
  }, [search])

  return { allResults, query, loading, setQuery, reload: search }
}
