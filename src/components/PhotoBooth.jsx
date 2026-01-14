import { useState, useEffect, useRef, useCallback } from 'react'
import useCamera from '../hooks/useCamera'
import { getGridConfig } from '../App'

// Capture states
const CAPTURE_STATES = {
  READY: 'ready',
  COUNTDOWN: 'countdown',
  FLASH: 'flash',
  CAPTURED: 'captured',
  COMPLETE: 'complete',
}

// Ring light tone presets
const RING_LIGHT_TONES = {
  warm: {
    id: 'warm',
    name: 'Warm',
    cssClass: 'ring-light-warm',
    icon: '🌅',
  },
  neutral: {
    id: 'neutral',
    name: 'Neutral',
    cssClass: 'ring-light-neutral',
    icon: '⚪',
  },
  cool: {
    id: 'cool',
    name: 'Cool',
    cssClass: 'ring-light-cool',
    icon: '❄️',
  },
}

function PhotoBooth({ layout, orientation, onComplete, onBack }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  
  const { stream, error, isLoading, startCamera, stopCamera } = useCamera()
  
  const [captureState, setCaptureState] = useState(CAPTURE_STATES.READY)
  const [countdown, setCountdown] = useState(3)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [capturedPhotos, setCapturedPhotos] = useState([])
  const [showFlash, setShowFlash] = useState(false)
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 })

  // Ring light state
  const [ringLightOn, setRingLightOn] = useState(false)
  const [ringLightTone, setRingLightTone] = useState(RING_LIGHT_TONES.neutral)

  // Get grid config for current layout + orientation
  const gridConfig = getGridConfig(layout, orientation)
  const totalPhotos = layout?.shots || 4
  const countdownDuration = 3

  // Camera aspect ratio - check for layout-specific override first
  const getCameraAspectRatio = () => {
    if (layout?.cameraAspectByOrientation && orientation?.id) {
      return layout.cameraAspectByOrientation[orientation.id]
    }
    return orientation?.aspectRatio || (9 / 16)
  }
  
  const targetAspectRatio = getCameraAspectRatio()
  const isCameraHorizontal = targetAspectRatio > 1

  // Initialize camera on mount
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  // Connect stream to video element and track dimensions
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      
      videoRef.current.onloadedmetadata = () => {
        setVideoDimensions({
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        })
      }
    }
  }, [stream])

  // Calculate crop region to match CSS object-fit: cover
  const calculateCropRegion = useCallback(() => {
    if (!videoDimensions.width || !videoDimensions.height) {
      return null
    }

    const videoWidth = videoDimensions.width
    const videoHeight = videoDimensions.height
    const videoAspectRatio = videoWidth / videoHeight

    let srcX = 0
    let srcY = 0
    let srcWidth = videoWidth
    let srcHeight = videoHeight

    if (videoAspectRatio > targetAspectRatio) {
      srcWidth = videoHeight * targetAspectRatio
      srcX = (videoWidth - srcWidth) / 2
    } else {
      srcHeight = videoWidth / targetAspectRatio
      srcY = (videoHeight - srcHeight) / 2
    }

    return { srcX, srcY, srcWidth, srcHeight }
  }, [videoDimensions, targetAspectRatio])

  // Capture a single photo with proper cropping
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const cropRegion = calculateCropRegion()
    if (!cropRegion) return null

    const { srcX, srcY, srcWidth, srcHeight } = cropRegion

    const exportWidth = orientation?.width || 1080
    const photoExportWidth = Math.round(exportWidth * 0.8)
    const photoExportHeight = Math.round(photoExportWidth / targetAspectRatio)

    canvas.width = photoExportWidth
    canvas.height = photoExportHeight

    ctx.save()
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(
      video,
      srcX, srcY, srcWidth, srcHeight,
      0, 0, canvas.width, canvas.height
    )
    ctx.restore()

    return canvas.toDataURL('image/jpeg', 0.92)
  }, [calculateCropRegion, orientation, targetAspectRatio])

  // Start capture sequence
  const startCapture = useCallback(() => {
    setCaptureState(CAPTURE_STATES.COUNTDOWN)
    setCurrentPhotoIndex(0)
    setCapturedPhotos([])
    setCountdown(countdownDuration)
  }, [countdownDuration])

  // Countdown timer
  useEffect(() => {
    if (captureState !== CAPTURE_STATES.COUNTDOWN) return

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setShowFlash(true)
      setCaptureState(CAPTURE_STATES.FLASH)

      setTimeout(() => {
        setShowFlash(false)
        const photo = capturePhoto()
        
        if (photo) {
          setCapturedPhotos(prev => [...prev, photo])
          
          if (currentPhotoIndex + 1 < totalPhotos) {
            setCurrentPhotoIndex(i => i + 1)
            setCountdown(countdownDuration)
            setCaptureState(CAPTURE_STATES.COUNTDOWN)
          } else {
            setCaptureState(CAPTURE_STATES.COMPLETE)
          }
        }
      }, 200)
    }
  }, [captureState, countdown, capturePhoto, currentPhotoIndex, totalPhotos, countdownDuration])

  // Notify parent when complete
  useEffect(() => {
    if (captureState === CAPTURE_STATES.COMPLETE && capturedPhotos.length === totalPhotos) {
      const timer = setTimeout(() => {
        onComplete(capturedPhotos)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [captureState, capturedPhotos, totalPhotos, onComplete])

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="glass rounded-3xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold mb-3">Camera Access Denied</h2>
          <p className="text-secondary mb-6">{error}</p>
          <button
            onClick={() => startCamera()}
            className="px-6 py-3 rounded-xl bg-[#B8001F]/10 hover:bg-[#B8001F]/20 text-[#B8001F] transition-colors mr-3"
          >
            Try Again
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl glass hover:bg-[var(--color-surface)] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📷</div>
          <p className="text-secondary">Starting camera...</p>
        </div>
      </div>
    )
  }

  // LARGER preview container styles
  const getPreviewContainerStyle = () => {
    if (isCameraHorizontal) {
      return {
        aspectRatio: '16/9',
        width: '100%',
        maxWidth: '900px',  // Much larger
        maxHeight: '70vh',
      }
    } else {
      return {
        aspectRatio: '9/16',
        width: '100%',
        maxWidth: '450px',  // Larger for vertical
        maxHeight: '80vh',
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6">
      {/* Minimal Header */}
      <div className="text-center mb-4 fade-up">
        <h2 className="font-['Syne'] text-xl md:text-2xl font-bold mb-1">
          {captureState === CAPTURE_STATES.READY && 'Get Ready!'}
          {captureState === CAPTURE_STATES.COUNTDOWN && `Photo ${currentPhotoIndex + 1} of ${totalPhotos}`}
          {captureState === CAPTURE_STATES.COMPLETE && 'All Done! 🎉'}
        </h2>
        <p className="text-secondary text-sm">
          {layout?.name} • {orientation?.name}
        </p>
      </div>

      {/* Camera Preview - LARGER */}
      <div className="relative w-full flex justify-center">
        <div 
          className="relative rounded-2xl overflow-hidden shadow-lg"
          style={getPreviewContainerStyle()}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover camera-mirror"
          />

          {/* Ring Light - Exposure Boost Layer */}
          {ringLightOn && (
            <div className="ring-light-boost" />
          )}

          {/* Ring Light - Main Glow */}
          {ringLightOn && (
            <div className={`ring-light-overlay ${ringLightTone.cssClass}`} />
          )}

          {/* Flash */}
          {showFlash && (
            <div className="absolute inset-0 bg-white z-20" />
          )}

          {/* Countdown */}
          {captureState === CAPTURE_STATES.COUNTDOWN && countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-15">
              <div 
                className="text-[120px] md:text-[180px] font-bold text-white scale-in"
                style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
                key={countdown}
              >
                {countdown}
              </div>
            </div>
          )}

          {/* Photo Counter - Top Right */}
          <div className="absolute top-3 right-3 flex gap-1.5 z-10">
            {Array(totalPhotos).fill(null).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i < capturedPhotos.length 
                    ? 'bg-[#B8001F] scale-125' 
                    : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      {capturedPhotos.length > 0 && (
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          {capturedPhotos.map((photo, i) => (
            <div 
              key={i}
              className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden shadow-md scale-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <img src={photo} alt={`Captured ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls - Compact */}
      <div className="mt-6 flex flex-col items-center gap-4">
        {/* Ring Light Toggle - Inline */}
        <div className="glass rounded-full px-4 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">💡</span>
            <span className="text-sm font-medium">Light</span>
          </div>
          
          <button
            onClick={() => setRingLightOn(!ringLightOn)}
            className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
              ringLightOn 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-400' 
                : 'bg-[var(--color-border)]'
            }`}
          >
            <div 
              className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                ringLightOn ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>

          {/* Tone buttons - only show when on */}
          {ringLightOn && (
            <div className="flex gap-1 pl-2 border-l border-[var(--color-border)]">
              {Object.values(RING_LIGHT_TONES).map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => setRingLightTone(tone)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    ringLightTone.id === tone.id 
                      ? 'bg-[#B8001F]/20 ring-2 ring-[#B8001F]' 
                      : 'hover:bg-[var(--color-surface)]'
                  }`}
                  title={tone.name}
                >
                  <span className="text-sm">{tone.icon}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Buttons */}
        <div className="flex items-center gap-3">
          {captureState === CAPTURE_STATES.READY && (
            <>
              <button
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl glass text-secondary hover:text-primary transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={startCapture}
                className="px-8 py-3 rounded-xl btn-primary text-white font-semibold text-lg pulse-glow"
              >
                📸 Capture
              </button>
            </>
          )}

          {captureState === CAPTURE_STATES.COUNTDOWN && (
            <button
              onClick={() => {
                setCaptureState(CAPTURE_STATES.READY)
                setCapturedPhotos([])
                setCurrentPhotoIndex(0)
              }}
              className="px-6 py-3 rounded-xl glass hover:bg-[var(--color-surface)] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PhotoBooth
