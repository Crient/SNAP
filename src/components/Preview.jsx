import { useState, useEffect, useRef } from 'react'
import { getGridConfig } from '../App'

function Preview({ photos, layout, orientation, onConfirm, onRetake }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [composedImage, setComposedImage] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Compose photos into final layout
  useEffect(() => {
    if (!photos.length || !layout || !orientation || !canvasRef.current) return

    const composeImage = async () => {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      const gridConfig = getGridConfig(layout, orientation)
      const { rows, cols, captionSpace } = gridConfig

      const canvasWidth = orientation.width
      const canvasHeight = orientation.height

      canvas.width = canvasWidth
      canvas.height = canvasHeight

      const padding = Math.min(canvasWidth, canvasHeight) * 0.03
      const gap = Math.min(canvasWidth, canvasHeight) * 0.015
      const brandingHeight = 40
      const captionHeight = captionSpace ? canvasHeight * 0.08 : 0

      const availableWidth = canvasWidth - (padding * 2) - (gap * (cols - 1))
      const availableHeight = canvasHeight - (padding * 2) - (gap * (rows - 1)) - brandingHeight - captionHeight

      const photoWidth = availableWidth / cols
      const photoHeight = availableHeight / rows

      // Background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // Load images
      const loadedImages = await Promise.all(
        photos.map(src => {
          return new Promise((resolve) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = () => resolve(null)
            img.src = src
          })
        })
      )

      // Draw photos
      loadedImages.forEach((img, index) => {
        if (!img || index >= layout.shots) return

        const col = index % cols
        const row = Math.floor(index / cols)

        const x = padding + (col * (photoWidth + gap))
        const y = padding + (row * (photoHeight + gap))

        const cornerRadius = Math.min(photoWidth, photoHeight) * 0.02
        
        // Shadow
        ctx.save()
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'
        ctx.shadowBlur = 8
        ctx.shadowOffsetY = 2
        ctx.fillStyle = '#ffffff'
        roundRect(ctx, x, y, photoWidth, photoHeight, cornerRadius)
        ctx.fill()
        ctx.restore()

        // Photo
        ctx.save()
        roundRect(ctx, x, y, photoWidth, photoHeight, cornerRadius)
        ctx.clip()
        drawImageCover(ctx, img, x, y, photoWidth, photoHeight)
        ctx.restore()
      })

      // Branding - Use Manrope
      ctx.fillStyle = '#9CA3AF'
      ctx.font = `600 ${Math.round(canvasWidth * 0.014)}px 'Manrope', sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('SNAP', canvasWidth / 2, canvasHeight - 12)

      setComposedImage(canvas.toDataURL('image/png'))
    }

    composeImage()
  }, [photos, layout, orientation])

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  function drawImageCover(ctx, img, x, y, width, height) {
    const imgRatio = img.width / img.height
    const targetRatio = width / height

    let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height

    if (imgRatio > targetRatio) {
      srcW = img.height * targetRatio
      srcX = (img.width - srcW) / 2
    } else {
      srcH = img.width / targetRatio
      srcY = (img.height - srcH) / 2
    }

    ctx.drawImage(img, srcX, srcY, srcW, srcH, x, y, width, height)
  }

  const handleConfirm = () => {
    onConfirm()
  }

  const isVertical = orientation?.id === 'vertical'
  const gridConfig = getGridConfig(layout, orientation)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Header - Manrope 700 for title */}
      <div className={`text-center mb-6 ${isLoaded ? 'fade-up' : 'opacity-0'}`}>
        <h2 className="text-3xl md:text-4xl font-bold mb-2">
          Preview ✨
        </h2>
        <p className="text-[var(--color-text-secondary)] font-semibold">
          {layout?.name} • {orientation?.name}
        </p>
      </div>

      {/* Preview */}
      <div className={`relative ${isLoaded ? 'scale-in' : 'opacity-0'}`}>
        <div className="glass rounded-2xl p-3 md:p-4">
          {composedImage ? (
            <img 
              src={composedImage} 
              alt="Composed preview" 
              className="rounded-xl shadow-lg"
              style={{ 
                maxWidth: isVertical ? '300px' : '90vw', 
                maxHeight: isVertical ? '70vh' : '50vh' 
              }}
            />
          ) : (
            <div 
              className="flex items-center justify-center bg-[var(--color-surface)] rounded-xl"
              style={{ 
                width: isVertical ? '200px' : '400px', 
                height: isVertical ? '355px' : '225px' 
              }}
            >
              <div className="text-center">
                <div className="text-4xl animate-spin mb-3">⚙️</div>
                <p className="text-[var(--color-text-secondary)] font-medium">Composing...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Actions - Manrope 700 for primary button */}
      <div className={`mt-8 flex flex-col sm:flex-row items-center gap-4 ${isLoaded ? 'fade-up delay-300' : 'opacity-0'}`}>
        <button
          onClick={onRetake}
          className="px-6 py-3 rounded-xl glass text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors font-semibold"
        >
          ↩ Retake
        </button>
        <button
          onClick={handleConfirm}
          disabled={!composedImage}
          className="px-8 py-4 rounded-xl btn-primary text-white font-bold text-lg 
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Edit & Export →
        </button>
      </div>
    </div>
  )
}

export default Preview
