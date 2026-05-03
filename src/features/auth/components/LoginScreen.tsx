import {
  Dumbbell, Mail, Lock, Eye, EyeOff, AlertCircle,
  ArrowLeft, CheckCircle, User, UserPlus,
} from 'lucide-react'
import { useState } from 'react'
import { useLogin } from '../hooks/useLogin'
import { usePasswordReset } from '../hooks/usePasswordReset'
import { useSignUp } from '../hooks/useSignUp'
import { Button } from '../../../components/ui/Button'
import './LoginScreen.css'

type LoginView = 'login' | 'register' | 'reset'

export function LoginScreen() {
  const [view, setView] = useState<LoginView>('login')

  return (
    <div className="login-screen">
      <div className="login-screen__bg" />
      {view === 'login' && (
        <LoginForm
          onSwitchToReset={() => setView('reset')}
          onSwitchToRegister={() => setView('register')}
        />
      )}
      {view === 'register' && (
        <RegisterForm onBack={() => setView('login')} />
      )}
      {view === 'reset' && (
        <ResetForm onBack={() => setView('login')} />
      )}
    </div>
  )
}

/* --- Login Form --- */

type LoginFormProps = {
  onSwitchToReset: () => void
  onSwitchToRegister: () => void
}

function LoginForm({ onSwitchToReset, onSwitchToRegister }: LoginFormProps) {
  const { email, password, error, loading, setEmail, setPassword, submitLogin } = useLogin()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form className="login-card" onSubmit={(e) => { e.preventDefault(); submitLogin() }}>
      <div className="login-card__header">
        <div className="login-card__logo-ring">
          <Dumbbell size={32} strokeWidth={2} />
        </div>
        <h1 className="login-card__title">GYM-YJMG</h1>
        <p className="login-card__subtitle">Entrenamiento personal en casa</p>
      </div>

      {error && (
        <div className="login-card__error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="login-card__field">
        <label htmlFor="login-email" className="login-card__label">Correo</label>
        <div className="login-card__input-wrap">
          <Mail size={18} className="login-card__input-icon" />
          <input
            id="login-email"
            type="email"
            className="login-card__input"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
        </div>
      </div>

      <div className="login-card__field">
        <label htmlFor="login-password" className="login-card__label">Contraseña</label>
        <div className="login-card__input-wrap">
          <Lock size={18} className="login-card__input-icon" />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            className="login-card__input"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="login-card__toggle-pw"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <Button variant="primary" size="lg" fullWidth loading={loading} type="submit">
        Iniciar sesión
      </Button>

      <div className="login-card__divider">
        <span>¿Nuevo en GYM-YJMG?</span>
      </div>

      <Button
        variant="ghost"
        size="lg"
        fullWidth
        type="button"
        onClick={onSwitchToRegister}
      >
        <UserPlus size={18} />
        Crear cuenta
      </Button>

      <button type="button" className="login-card__link" onClick={onSwitchToReset}>
        ¿Olvidaste tu contraseña?
      </button>
    </form>
  )
}

/* --- Register Form --- */

type RegisterFormProps = { onBack: () => void }

function RegisterForm({ onBack }: RegisterFormProps) {
  const {
    email, password, confirmPassword, fullName, error, loading, success,
    setEmail, setPassword, setConfirmPassword, setFullName, submitSignUp,
  } = useSignUp()
  const [showPw, setShowPw] = useState(false)

  if (success) {
    return (
      <div className="login-card">
        <div className="login-card__header">
          <div className="login-card__logo-ring login-card__logo-ring--success">
            <CheckCircle size={32} />
          </div>
          <h2 className="login-card__title">¡Cuenta creada!</h2>
          <p className="login-card__subtitle">
            Revisa tu correo para confirmar tu cuenta, luego inicia sesión.
          </p>
        </div>
        <Button variant="primary" size="lg" fullWidth type="button" onClick={onBack}>
          Ir al inicio de sesión
        </Button>
      </div>
    )
  }

  return (
    <form className="login-card" onSubmit={(e) => { e.preventDefault(); submitSignUp() }}>
      <button type="button" className="login-card__back" onClick={onBack} aria-label="Volver">
        <ArrowLeft size={20} />
      </button>

      <div className="login-card__header">
        <div className="login-card__logo-ring">
          <UserPlus size={28} strokeWidth={2} />
        </div>
        <h2 className="login-card__title login-card__title--sm">Crear cuenta</h2>
        <p className="login-card__subtitle">Únete a GYM-YJMG</p>
      </div>

      {error && (
        <div className="login-card__error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Nombre */}
      <div className="login-card__field">
        <label htmlFor="reg-name" className="login-card__label">Nombre completo *</label>
        <div className="login-card__input-wrap">
          <User size={18} className="login-card__input-icon" />
          <input
            id="reg-name"
            type="text"
            className="login-card__input"
            placeholder="Tu nombre"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      {/* Correo */}
      <div className="login-card__field">
        <label htmlFor="reg-email" className="login-card__label">Correo *</label>
        <div className="login-card__input-wrap">
          <Mail size={18} className="login-card__input-icon" />
          <input
            id="reg-email"
            type="email"
            className="login-card__input"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
      </div>

      {/* Contraseña */}
      <div className="login-card__field">
        <label htmlFor="reg-password" className="login-card__label">Contraseña * (mín. 8 caracteres)</label>
        <div className="login-card__input-wrap">
          <Lock size={18} className="login-card__input-icon" />
          <input
            id="reg-password"
            type={showPw ? 'text' : 'password'}
            className="login-card__input"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="login-card__toggle-pw"
            onClick={() => setShowPw(!showPw)}
            aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Confirmar contraseña */}
      <div className="login-card__field">
        <label htmlFor="reg-confirm" className="login-card__label">Confirmar contraseña *</label>
        <div className="login-card__input-wrap">
          <Lock size={18} className="login-card__input-icon" />
          <input
            id="reg-confirm"
            type={showPw ? 'text' : 'password'}
            className="login-card__input"
            placeholder="Repite la contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
      </div>

      <Button variant="primary" size="lg" fullWidth loading={loading} type="submit">
        Crear cuenta
      </Button>
    </form>
  )
}

/* --- Reset Form --- */

type ResetFormProps = { onBack: () => void }

function ResetForm({ onBack }: ResetFormProps) {
  const { resetEmail, resetError, resetSuccess, resetLoading, setResetEmail, submitReset } =
    usePasswordReset()

  return (
    <form className="login-card" onSubmit={(e) => { e.preventDefault(); submitReset() }}>
      <button type="button" className="login-card__back" onClick={onBack} aria-label="Volver al login">
        <ArrowLeft size={20} />
      </button>

      <div className="login-card__header">
        <h2 className="login-card__title login-card__title--sm">Recuperar acceso</h2>
        <p className="login-card__subtitle">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
        </p>
      </div>

      {resetError && (
        <div className="login-card__error" role="alert">
          <AlertCircle size={16} />
          <span>{resetError}</span>
        </div>
      )}

      {resetSuccess ? (
        <div className="login-card__success" role="status">
          <CheckCircle size={16} />
          <span>Correo enviado. Revisa tu bandeja de entrada</span>
        </div>
      ) : (
        <>
          <div className="login-card__field">
            <label htmlFor="reset-email" className="login-card__label">Correo</label>
            <div className="login-card__input-wrap">
              <Mail size={18} className="login-card__input-icon" />
              <input
                id="reset-email"
                type="email"
                className="login-card__input"
                placeholder="tu@correo.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>
          <Button variant="primary" size="lg" fullWidth loading={resetLoading} type="submit">
            Enviar enlace
          </Button>
        </>
      )}
    </form>
  )
}
