
import { HamsterLoader } from '../ui/HamsterLoader'
import './LoadingScreen.css'

export function LoadingScreen() {
  return (
    <div className="loading-screen">
      <HamsterLoader size={120} />
      <p className="loading-screen__text">Cargando...</p>
    </div>
  )
}
