/* ============================================================
   usePersonalRecords.ts — Hook para Personal Records del usuario
   FASE 04 — GYM-YJMG
   ============================================================ */
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../../stores/authStore'
import { getPersonalRecords, type PersonalRecordWithRecency } from '../../../services/records.service'

export function usePersonalRecords() {
  const [records, setRecords] = useState<PersonalRecordWithRecency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userId = useAuthStore(s => s.user?.id)

  useEffect(() => {
    if (!userId) return

    async function fetchRecords() {
      setLoading(true)
      const { data, error: fetchError } = await getPersonalRecords(userId!)

      if (fetchError) {
        setError(fetchError)
      } else {
        setRecords(data)
      }
      setLoading(false)
    }

    fetchRecords()
  }, [userId])

  return { records, loading, error }
}
