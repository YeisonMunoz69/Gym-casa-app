import { useState } from 'react'
import { sendPasswordReset } from '../../../services/auth.service'

type UsePasswordResetReturn = {
  resetEmail: string
  resetError: string | null
  resetSuccess: boolean
  resetLoading: boolean
  setResetEmail: (value: string) => void
  submitReset: () => Promise<void>
  clearReset: () => void
}

export function usePasswordReset(): UsePasswordResetReturn {
  const [resetEmail, setResetEmail] = useState('')
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function submitReset() {
    if (!resetEmail.trim()) {
      setResetError('Ingresa tu correo')
      return
    }

    setResetError(null)
    setResetLoading(true)

    const result = await sendPasswordReset(resetEmail.trim())

    if (result.error) {
      setResetError('No se pudo enviar el correo. Verifica tu direccion')
    } else {
      setResetSuccess(true)
    }

    setResetLoading(false)
  }

  function clearReset() {
    setResetEmail('')
    setResetError(null)
    setResetSuccess(false)
  }

  return {
    resetEmail,
    resetError,
    resetSuccess,
    resetLoading,
    setResetEmail,
    submitReset,
    clearReset,
  }
}
