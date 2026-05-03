import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeMode = 'dark' | 'light'
type AccentColor = 'teal' | 'cyan' | 'purple' | 'orange' | 'rose'

type ThemeState = {
  mode: ThemeMode
  accent: AccentColor
  toggleMode: () => void
  setMode: (mode: ThemeMode) => void
  setAccent: (accent: AccentColor) => void
}

export const ACCENT_VALUES: Record<AccentColor, string> = {
  teal: 'hsl(168, 72%, 45%)',
  cyan: 'hsl(190, 80%, 50%)',
  purple: 'hsl(265, 70%, 60%)',
  orange: 'hsl(25, 90%, 55%)',
  rose: 'hsl(345, 75%, 55%)',
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      accent: 'teal',
      toggleMode: () =>
        set((state) => ({
          mode: state.mode === 'dark' ? 'light' : 'dark',
        })),
      setMode: (mode) => set({ mode }),
      setAccent: (accent) => set({ accent }),
    }),
    { name: 'gym-yjmg-theme' },
  ),
)
