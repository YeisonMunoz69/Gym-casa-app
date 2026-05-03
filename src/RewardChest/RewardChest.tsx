import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star } from 'lucide-react';
import styles from './RewardChest.module.css';

// SVG Detallado de un Cofre del Tesoro estilo Fantasy
const TreasureChestSVG = () => (
  <svg viewBox="0 0 100 100" className={styles.chestSvg} preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="wood" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#8b5a2b" />
        <stop offset="100%" stopColor="#4a2e15" />
      </linearGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffe699" />
        <stop offset="50%" stopColor="#f5aa1c" />
        <stop offset="100%" stopColor="#b87300" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Sombras base */}
    <ellipse cx="50" cy="92" rx="40" ry="8" fill="rgba(0,0,0,0.4)" />

    {/* Cuerpo de madera */}
    <path d="M12 48 L88 48 L84 88 L16 88 Z" fill="url(#wood)" stroke="#2b1a0c" strokeWidth="1.5" />
    
    {/* Tablones de madera verticales */}
    <line x1="30" y1="48" x2="28" y2="88" stroke="#2b1a0c" strokeWidth="1.5" opacity="0.6" />
    <line x1="50" y1="48" x2="50" y2="88" stroke="#2b1a0c" strokeWidth="1.5" opacity="0.6" />
    <line x1="70" y1="48" x2="72" y2="88" stroke="#2b1a0c" strokeWidth="1.5" opacity="0.6" />
    
    {/* Refuerzos de Oro Inferiores e intermedios */}
    <path d="M12 48 L88 48 L87 56 L13 56 Z" fill="url(#gold)" />
    <path d="M16 88 L84 88 L85 80 L15 80 Z" fill="url(#gold)" />
    <polygon points="12,48 13,56 15,80 16,88 22,88 20,48" fill="url(#gold)" stroke="#aa6000" strokeWidth="0.5" />
    <polygon points="88,48 87,56 85,80 84,88 78,88 80,48" fill="url(#gold)" stroke="#aa6000" strokeWidth="0.5" />

    {/* Tapa Superior (Lid) */}
    <path d="M7 48 C 7 15, 93 15, 93 48 Z" fill="url(#wood)" stroke="#2b1a0c" strokeWidth="1.5" />
    
    {/* Bordes de oro de la tapa */}
    <path d="M7 48 C 7 15, 93 15, 93 48" fill="none" stroke="url(#gold)" strokeWidth="6" />
    <path d="M30 25 C 30 35, 30 48, 30 48" fill="none" stroke="url(#gold)" strokeWidth="4" />
    <path d="M50 20 C 50 35, 50 48, 50 48" fill="none" stroke="url(#gold)" strokeWidth="4" />
    <path d="M70 25 C 70 35, 70 48, 70 48" fill="none" stroke="url(#gold)" strokeWidth="4" />
    
    {/* Cerradura frontal dorada */}
    <rect x="42" y="38" width="16" height="22" rx="3" fill="url(#gold)" stroke="#7a4b00" strokeWidth="1.5" filter="url(#glow)" />
    <circle cx="50" cy="46" r="3" fill="#1a1a1a" />
    <path d="M49 46 L49 53 L51 53 L51 46 Z" fill="#1a1a1a" />
    
    {/* Remaches de hierro */}
    <circle cx="21" cy="52" r="1.5" fill="#fff" opacity="0.6" />
    <circle cx="79" cy="52" r="1.5" fill="#fff" opacity="0.6" />
    <circle cx="18" cy="84" r="1.5" fill="#fff" opacity="0.6" />
    <circle cx="82" cy="84" r="1.5" fill="#fff" opacity="0.6" />
  </svg>
);

interface RewardChestProps {
  rewardImage?: string;
  rewardName?: string;
  rarity?: string;
  onClose?: () => void;
}

export const RewardChest: React.FC<RewardChestProps> = ({
  rewardImage = '💎',
  rewardName = 'Cristales Arcanos',
  rarity = 'MÍTICO',
  onClose,
}) => {
  const [clicks, setClicks] = useState(0);
  const maxClicks = 5;
  const isOpened = clicks >= maxClicks;

  // Mensajes motivacionales basados en la cantidad de toques
  const motivationalMessages = [
    "¡Un cofre misterioso!",
    "¡Sigue así!",
    "¡El tesoro vibra con fuerza!",
    "¡Las cerraduras están cediendo!",
    "¡Un último golpe para romperlo!"
  ];

  const handleTap = () => {
    if (isOpened) return;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50 + clicks * 20); // La vibración se hace más fuerte con cada toque
    }

    setClicks((prev) => prev + 1);

    if (clicks + 1 === maxClicks && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 200, 50, 400]);
    }
  };

  // Nivel de intensidad que crece exponencialmente
  const shakeIntensity = clicks * 4; 
  const currentMessage = motivationalMessages[clicks];

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <AnimatePresence mode="wait">
          {!isOpened ? (
            <motion.div
              key="chest"
              className={styles.chestWrapper}
              onClick={handleTap}
              // Efecto visual dinámico
              animate={{
                x: clicks > 0 ? [0, -shakeIntensity, shakeIntensity, -shakeIntensity, shakeIntensity, 0] : 0,
                y: clicks > 0 ? [0, -shakeIntensity/2, shakeIntensity/2, 0] : 0,
                scale: 1 + clicks * 0.08, // Se hincha dramáticamente
                filter: `drop-shadow(0 0 ${clicks * 15}px rgba(255, 215, 0, ${0.2 + clicks * 0.15}))`
              }}
              transition={{ duration: 0.3 }}
              whileTap={{ scale: 0.85 }}
            >
              <div className={styles.chestGraphic}>
                <TreasureChestSVG />
              </div>
              
              {/* Mensaje Dinámico Sin Números Exactos */}
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={clicks}
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.8 }}
                  className={styles.motivationalText}
                >
                  {currentMessage}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="reward"
              className={styles.rewardWrapper}
              initial={{ scale: 0, y: 100, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
              }}
            >
              {/* Efecto de destellos (partículas traseras) */}
              <motion.div 
                className={styles.rays}
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              />

              {/* Contenido de la recompensa */}
              <div className={styles.rewardItem}>
                <div className={styles.emoji}>{rewardImage}</div>
              </div>

              <motion.div 
                className={styles.rarityBadge}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              >
                ♦ {rarity}
              </motion.div>

              <h2 className={styles.rewardTitle}>{rewardName}</h2>
              <p className={styles.rewardSubtitle}>
                ¡Has obtenido <strong className={styles.highlightText}>x150</strong> unidades con éxito!
              </p>
              
              <button className={styles.claimButton} onClick={onClose}>
                RECLAMAR BOTÍN
              </button>

              {/* Estrellitas flotando (lucide-react) */}
              <motion.div className={styles.particleOne} animate={{ y: [-10, 10], opacity: [0.5, 1] }} transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse' }}>
                <Sparkles color="#ffd700" size={32} />
              </motion.div>
              <motion.div className={styles.particleTwo} animate={{ y: [10, -10], opacity: [0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2, repeatType: 'reverse' }}>
                <Star color="#ffd700" fill="#ffd700" size={24} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
