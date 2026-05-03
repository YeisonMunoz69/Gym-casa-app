import { useState } from 'react'
import { loginWithEmail } from '../../../services/auth.service'

type UseLoginReturn = {
  email: string
  password: string
  error: string | null
  loading: boolean
  setEmail: (value: string) => void
  setPassword: (value: string) => void
  submitLogin: () => Promise<void>
}

export function useLogin(): UseLoginReturn {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submitLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Ingresa tu correo y contrasena')
      return
    }

    setError(null)
    setLoading(true)

    const result = await loginWithEmail({ email: email.trim(), password })

    if (result.error) {
      setError(translateAuthError(result.error))
    }

    setLoading(false)
  }

  return { email, password, error, loading, setEmail, setPassword, submitLogin }
}

function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Correo o contrasena incorrectos'
  }
  if (message.includes('Email not confirmed')) {
    return 'Confirma tu correo antes de iniciar sesion'
  }
  if (message.includes('Too many requests')) {
    return 'Demasiados intentos. Espera un momento'
  }
  return 'Error al iniciar sesion. Intenta de nuevo'
}
