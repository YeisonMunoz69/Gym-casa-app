import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react'
import './Toast.css'

type ToastType = 'success' | 'error' | 'warning' | 'info'

type ToastData = {
  id: string
  message: string
  type: ToastType
  duration?: number
}

type ToastItemProps = {
  toast: ToastData
  onDismiss: (id: string) => void
}

const TOAST_ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const Icon = TOAST_ICONS[toast.type]

  useEffect(() => {
    const timeout = setTimeout(() => {
      onDismiss(toast.id)
    }, toast.duration ?? 3500)
    return () => clearTimeout(timeout)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div className={`toast toast--${toast.type}`} role="alert">
      <Icon size={18} className="toast__icon" />
      <span className="toast__message">{toast.message}</span>
      <button
        className="toast__dismiss"
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar notificacion"
      >
        <X size={14} />
      </button>
    </div>
  )
}

/* --- Toast container + global API --- */

let addToastGlobal: ((toast: Omit<ToastData, 'id'>) => void) | null = null

export function showToast(message: string, type: ToastType = 'info', duration?: number) {
  addToastGlobal?.({ message, type, duration })
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  useEffect(() => {
    addToastGlobal = (toast) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { ...toast, id }])
    }
    return () => {
      addToastGlobal = null
    }
  }, [])

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  )
}
