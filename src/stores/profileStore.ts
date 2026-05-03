import { create } from 'zustand'
import type { UserProfile } from '../services/profiles.service'
import { getProfile, upsertProfile } from '../services/profiles.service'

type ProfileStore = {
  profile: UserProfile | null
  loading: boolean
  fetchProfile: (userId: string) => Promise<void>
  setProfile: (p: UserProfile | null) => void
  saveProfile: (userId: string, input: Partial<UserProfile>) => Promise<boolean>
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  loading: true,

  setProfile: (profile) => set({ profile }),

  fetchProfile: async (userId) => {
    set({ loading: true })
    const profile = await getProfile(userId)
    set({ profile, loading: false })
  },

  saveProfile: async (userId, input) => {
    const { data, error } = await upsertProfile(userId, input)
    if (error || !data) return false
    set({ profile: data })
    return true
  },
}))
