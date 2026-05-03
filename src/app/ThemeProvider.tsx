import { useEffect } from 'react'
import { useThemeStore, ACCENT_VALUES } from '../stores/themeStore'

/**
 * Aplica el tema (mode + accent) al documento.
 * Se monta una sola vez en el nivel mas alto de la app.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode)
  const accent = useThemeStore((s) => s.accent)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  useEffect(() => {
    const root = document.documentElement
    const accentHsl = ACCENT_VALUES[accent]
    root.style.setProperty('--color-primary', accentHsl)

    const hslMatch = accentHsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
    if (hslMatch) {
      const [, h, s, l] = hslMatch
      root.style.setProperty('--color-primary-hover', `hsl(${h}, ${s}%, ${Number(l) + 7}%)`)
      root.style.setProperty('--color-primary-active', `hsl(${h}, ${s}%, ${Number(l) - 7}%)`)
      root.style.setProperty('--color-primary-glow', `hsla(${h}, ${s}%, ${l}%, 0.18)`)
      root.style.setProperty('--color-primary-subtle', `hsla(${h}, ${s}%, ${l}%, 0.10)`)
    }
  }, [accent])

  return <>{children}</>
}
