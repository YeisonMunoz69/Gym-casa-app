import { useState } from 'react'
import { supabase } from '../../../services/supabase'

type SignUpState = {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  error: string | null
  loading: boolean
  success: boolean
}

export function useSignUp() {
  const [state, setState] = useState<SignUpState>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    error: null,
    loading: false,
    success: false,
  })

  function setField<K extends keyof SignUpState>(key: K, value: SignUpState[K]) {
    setState((s) => ({ ...s, [key]: value, error: null }))
  }

  async function submitSignUp() {
    const { email, password, confirmPassword, fullName } = state

    if (!email || !password || !fullName) {
      setState((s) => ({ ...s, error: 'Completa todos los campos obligatorios' }))
      return
    }

    if (password.length < 8) {
      setState((s) => ({ ...s, error: 'La contraseña debe tener al menos 8 caracteres' }))
      return
    }

    if (password !== confirmPassword) {
      setState((s) => ({ ...s, error: 'Las contraseñas no coinciden' }))
      return
    }

    setState((s) => ({ ...s, loading: true, error: null }))

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    })

    if (error) {
      setState((s) => ({ ...s, loading: false, error: error.message }))
      return
    }

    // Si el email de confirmación está desactivado, el usuario entra directo
    // Si está activado, mostramos mensaje de éxito
    const needsConfirmation = !data.session

    setState((s) => ({
      ...s,
      loading: false,
      success: true,
      error: needsConfirmation
        ? null
        : null,
    }))
  }

  return {
    ...state,
    setEmail: (v: string) => setField('email', v),
    setPassword: (v: string) => setField('password', v),
    setConfirmPassword: (v: string) => setField('confirmPassword', v),
    setFullName: (v: string) => setField('fullName', v),
    submitSignUp,
  }
}
