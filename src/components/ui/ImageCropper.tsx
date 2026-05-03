import { useState, useRef, useEffect, type PointerEvent } from 'react'
import { ZoomIn, ZoomOut, Check, X } from 'lucide-react'
import { Button } from './Button'
import './ImageCropper.css'

type Props = {
  imageUrl: string
  onCrop: (blob: Blob) => void
  onCancel: () => void
}

export function ImageCropper({ imageUrl, onCrop, onCancel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Limits
  const [limits, setLimits] = useState({ minX: 0, maxX: 0, minY: 0, maxY: 0 })

  useEffect(() => {
    updateLimits()
  }, [zoom])

  function updateLimits() {
    if (!containerRef.current || !imageRef.current) return
    const c = containerRef.current.getBoundingClientRect()
    const i = imageRef.current.getBoundingClientRect()
    
    // Scale real image dims
    const scaledW = (imageRef.current.naturalWidth || i.width) * zoom
    const scaledH = (imageRef.current.naturalHeight || i.height) * zoom

    // For a cover effect on a square container, min dimension matches container
    const size = Math.min(scaledW, scaledH)
    const ratio = c.width / size
    
    const displayW = scaledW * ratio
    const displayH = scaledH * ratio
    
    const maxX = Math.max(0, (displayW - c.width) / 2)
    const maxY = Math.max(0, (displayH - c.height) / 2)
    
    setLimits({ minX: -maxX, maxX, minY: -maxY, maxY })
    setOffset(prev => ({
      x: Math.min(Math.max(prev.x, -maxX), maxX),
      y: Math.min(Math.max(prev.y, -maxY), maxY)
    }))
  }

  function handlePointerDown(e: PointerEvent) {
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    if (containerRef.current) containerRef.current.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging) return
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    setOffset({
      x: Math.min(Math.max(newX, limits.minX), limits.maxX),
      y: Math.min(Math.max(newY, limits.minY), limits.maxY)
    })
  }

  function handlePointerUp(e: PointerEvent) {
    setIsDragging(false)
    if (containerRef.current) containerRef.current.releasePointerCapture(e.pointerId)
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    const delta = e.deltaY * -0.001
    setZoom(z => Math.min(Math.max(1, z + delta), 3))
  }

  async function handleSave() {
    if (!imageRef.current || !containerRef.current) return
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 400 // Fixed output size
    canvas.width = size
    canvas.height = size

    const img = imageRef.current
    const c = containerRef.current.getBoundingClientRect()

    // Calc crop values
    const scale = Math.max(img.naturalWidth / c.width, img.naturalHeight / c.height) / zoom
    const sourceX = (img.naturalWidth - c.width * scale) / 2 - offset.x * scale
    const sourceY = (img.naturalHeight - c.height * scale) / 2 - offset.y * scale

    ctx.drawImage(img, sourceX, sourceY, c.width * scale, c.height * scale, 0, 0, size, size)
    
    canvas.toBlob((blob) => {
      if (blob) onCrop(blob)
    }, 'image/jpeg', 0.9)
  }

  return (
    <div className="img-cropper-overlay">
      <div className="img-cropper-modal">
        <h3 className="img-cropper-title">Ajustar foto (4x4)</h3>
        
        <div 
          className="img-cropper-container" 
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          <img 
            ref={imageRef}
            src={imageUrl} 
            alt="Crop target" 
            className="img-cropper-image"
            style={{
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            }}
            onLoad={updateLimits}
            draggable={false}
          />
          <div className="img-cropper-grid"></div>
        </div>

        <div className="img-cropper-controls">
          <ZoomOut size={16} />
          <input 
            type="range" 
            min="1" max="3" step="0.05" 
            value={zoom} 
            onChange={e => setZoom(parseFloat(e.target.value))} 
            className="img-cropper-slider"
          />
          <ZoomIn size={16} />
        </div>

        <div className="img-cropper-actions">
          <Button variant="ghost" onClick={onCancel}>
            <X size={16} /> Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <Check size={16} /> Aplicar
          </Button>
        </div>
      </div>
    </div>
  )
}
