import { ClipboardList, Play } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import './DashboardActions.css'

export function DashboardActions() {
  const navigate = useNavigate()

  return (
    <section className="dash-actions">
      <motion.button
        className="dash-action-btn dash-action-btn--secondary"
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/routines')}
      >
        <div className="dash-action-btn__icon-wrapper">
          <ClipboardList size={22} className="dash-action-btn__icon" />
        </div>
        <div className="dash-action-btn__text">
          <span className="dash-action-btn__title">Tus Rutinas</span>
          <span className="dash-action-btn__sub">Planificar</span>
        </div>
      </motion.button>

      <motion.button
        className="dash-action-btn dash-action-btn--primary"
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/session')}
      >
        <div className="dash-action-btn__icon-wrapper">
          <Play size={24} className="dash-action-btn__icon" fill="currentColor" />
        </div>
        <div className="dash-action-btn__text">
          <span className="dash-action-btn__title">Entrenar</span>
          <span className="dash-action-btn__sub">Iniciar la Sesión</span>
        </div>
      </motion.button>
    </section>
  )
}
