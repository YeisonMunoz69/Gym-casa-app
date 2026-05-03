import { useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuthStore } from '../stores/authStore'

/**
 * Escucha cambios de sesion de Supabase y sincroniza con el store.
 * Se monta una sola vez en el nivel mas alto de la app.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession)
  const setLoading = useAuthStore((s) => s.setLoading)

  useEffect(() => {
    setLoading(true)

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      },
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [setSession, setLoading])

  return <>{children}</>
}
