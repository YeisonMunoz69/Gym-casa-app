import './HamsterLoader.css'

export function HamsterLoader({ size = 100, className = '' }: { size?: number, className?: string }) {
  const scale = size / 168; // 168px es el ancho nativo (12em * 14px)
  
  return (
    <div className={`hamster-wrapper ${className}`} style={{ width: size, height: size, position: 'relative' }}>
      <div 
        aria-label="Cargando..." 
        role="img" 
        className="wheel-and-hamster"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        <div className="wheel"></div>
        <div className="hamster">
          <div className="hamster__body">
            <div className="hamster__head">
              <div className="hamster__ear"></div>
              <div className="hamster__eye"></div>
              <div className="hamster__nose"></div>
            </div>
            <div className="hamster__limb hamster__limb--fr"></div>
            <div className="hamster__limb hamster__limb--fl"></div>
            <div className="hamster__limb hamster__limb--br"></div>
            <div className="hamster__limb hamster__limb--bl"></div>
            <div className="hamster__tail"></div>
          </div>
        </div>
        <div className="spoke"></div>
      </div>
    </div>
  )
}
