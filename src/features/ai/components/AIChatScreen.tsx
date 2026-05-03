/* ============================================================
   AIChatScreen.tsx — Chat personalizado con Gemini
   FASE 06 — GYM-YJMG
   Fix: sugerencias con auto-send, textarea auto-grow,
   filtro de tema en system prompt.
   Sin emojis (SKILL-CODE §5.4). Límite: 150 líneas.
   ============================================================ */
import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Send, Sparkles, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserContext } from '../hooks/useUserContext'
import { generateChat } from '../../../services/ai.service'
import type { ChatMessage } from '../../../services/ai.service'
import { HamsterLoader } from '../../../components/ui/HamsterLoader'
import './AIChatScreen.css'

const WELCOME_MESSAGE: ChatMessage = {
  role: 'model',
  text: 'Hola! Soy tu entrenador IA. Tengo acceso a tus datos de entrenamiento y puedo ayudarte con fitness, nutricion y recuperacion. Que quieres saber?',
}

const SUGGESTIONS = [
  'Como puedo mejorar mi recuperacion muscular?',
  'Que deberia comer antes de entrenar?',
  'Como progreso mas rapido segun mis datos?',
  'Cuál sería la mejor rutina para mí?',
  'Que ejercicios deberia hacer?',
  'Qué dieta debo seguir para alcanzar mi objetivo?',
]

export function AIChatScreen() {
  const navigate = useNavigate()
  const { context, loading: ctxLoading } = useUserContext()

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // Auto-grow textarea
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [input])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sending || !context) return

    const userMsg: ChatMessage = { role: 'user', text: text.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)
    setError(null)

    // Historial completo incluyendo el nuevo mensaje (sin el welcome local)
    const history: ChatMessage[] = [
      ...messages.filter((_, i) => i > 0 || messages[0] !== WELCOME_MESSAGE),
      userMsg,
    ]

    const reply = await generateChat(history, context.systemPrompt)

    if (reply) {
      setMessages((prev) => [...prev, { role: 'model', text: reply }])
    } else {
      setError('Sin respuesta. Verifica tu conexion o la API Key.')
    }
    setSending(false)
  }, [sending, context, messages])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  if (ctxLoading) {
    return (
      <div className="ai-chat ai-chat--loading">
        <HamsterLoader />
        <p className="ai-chat__loading-text">Cargando tu contexto de entrenamiento...</p>
      </div>
    )
  }

  const showSuggestions = messages.length === 1 && !sending

  return (
    <div className="ai-chat">
      {/* Header */}
      <header className="ai-chat__header">
        <button className="ai-chat__back" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <div className="ai-chat__header-info">
          <div className="ai-chat__header-icon">
            <Sparkles size={16} />
          </div>
          <div>
            <h1 className="ai-chat__header-title">Entrenador impulsado con IA</h1>
            <p className="ai-chat__header-sub">Ayudando con Gemini 3.1 Flash — contexto personalizado para ti</p>
          </div>
        </div>
      </header>

      {/* Mensajes */}
      <div className="ai-chat__messages" id="chat-messages">
        {showSuggestions && (
          <div className="ai-chat__suggestions">
            <p className="ai-chat__suggestions-label">Preguntas frecuentes</p>
            <div className="ai-chat__suggestions-list">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="ai-chat__suggestion"
                  onClick={() => sendMessage(s)}
                  disabled={sending}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              className={`ai-chat__bubble ai-chat__bubble--${msg.role}`}
              initial={{ opacity: 0, y: 14, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            >
              {msg.role === 'model' && (
                <div className="ai-chat__bubble-icon" aria-hidden="true">
                  <Sparkles size={12} />
                </div>
              )}
              <p className="ai-chat__bubble-text">{msg.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <div className="ai-chat__typing" aria-label="El entrenador IA está escribiendo">
            <span /><span /><span />
          </div>
        )}

        {error && (
          <div className="ai-chat__error">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="ai-chat__input-area">
        <textarea
          ref={inputRef}
          className="ai-chat__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu pregunta sobre entrenamiento o nutricion..."
          rows={1}
          disabled={sending}
          aria-label="Mensaje para el entrenador IA"
        />
        <button
          className="ai-chat__send"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || sending}
          aria-label="Enviar mensaje"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
