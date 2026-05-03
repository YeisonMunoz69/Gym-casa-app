import { useEffect, useRef } from 'react'
import { useProfileStore } from '../../../stores/profileStore'
import { useAuthStore } from '../../../stores/authStore'

export function useUserProfile() {
  const userId = useAuthStore((s) => s.user?.id)
  const { profile, loading, fetchProfile, saveProfile } = useProfileStore()

  // Evitar llamadas duplicadas en React StrictMode y renders concurrentes
  const fetchedForRef = useRef<string | null>(null)

  useEffect(() => {
    if (userId && fetchedForRef.current !== userId) {
      fetchedForRef.current = userId
      fetchProfile(userId)
    }
  }, [userId, fetchProfile])

  return {
    profile,
    loading,
    hasProfile: profile !== null,
    saveProfile: (input: Parameters<typeof saveProfile>[1]) =>
      userId ? saveProfile(userId, input) : Promise.resolve(false),
  }
}
