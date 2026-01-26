import { useState, useEffect, useRef, useCallback } from 'react'
import useCamera from '../hooks/useCamera'

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

  const targetAspectRatio = (layout?.cameraAspectByOrientation && orientation?.id)
    ? layout.cameraAspectByOrientation[orientation.id]
    : (orientation?.aspectRatio || (9 / 16))
  const isCameraHorizontal = targetAspectRatio > 1
  
  const { stream, error, isLoading, startCamera, stopCamera, isMobile } = useCamera({ aspectRatio: targetAspectRatio })
  
  const [captureState, setCaptureState] = useState(CAPTURE_STATES.READY)
  const [countdown, setCountdown] = useState(3)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [capturedPhotos, setCapturedPhotos] = useState([])
  const [showFlash, setShowFlash] = useState(false)
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 })
  const videoAspectRatio = videoDimensions.width && videoDimensions.height
    ? videoDimensions.width / videoDimensions.height
    : null
  const aspectMismatch = videoAspectRatio
    ? Math.abs(videoAspectRatio - targetAspectRatio) / targetAspectRatio
    : 0
  const useContainFit = !isCameraHorizontal && isMobile && aspectMismatch > 0.12
  const [showCameraReminder, setShowCameraReminder] = useState(() => {
    try {
      const hasSeenReminder = sessionStorage.getItem('snap-camera-reminder-seen')
      if (!hasSeenReminder) {
        sessionStorage.setItem('snap-camera-reminder-seen', '1')
        return true
      }
    } catch {
      // Ignore storage errors (e.g., private mode)
    }
    return false
  })

  // Ring light state
  const [ringLightOn, setRingLightOn] = useState(false)
  const [ringLightTone, setRingLightTone] = useState(RING_LIGHT_TONES.neutral)
  const toneOptions = Object.values(RING_LIGHT_TONES)

  const totalPhotos = layout?.shots || 4
  const countdownDuration = 3
  const headerTitle = (() => {
    switch (captureState) {
      case CAPTURE_STATES.COUNTDOWN:
      case CAPTURE_STATES.FLASH:
        return `Photo ${currentPhotoIndex + 1} of ${totalPhotos}`
      case CAPTURE_STATES.COMPLETE:
        return 'All Done! 🎉'
      default:
        return 'Get Ready!'
    }
  })()

  // Initialize camera on mount
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

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
    const fitMode = useContainFit ? 'contain' : 'cover'

    const captureScale = Math.min(Math.max(window.devicePixelRatio || 1, 1.3), 2)
    const targetWidth = (orientation?.width || video.videoWidth || 1080) * captureScale
    const targetHeight = targetWidth / targetAspectRatio

    const sourceWidth = video.videoWidth || targetWidth
    const sourceHeight = video.videoHeight || targetHeight

    const scale = Math.min(1, sourceWidth / targetWidth, sourceHeight / targetHeight)
    const photoExportWidth = Math.round(targetWidth * scale)
    const photoExportHeight = Math.round(targetHeight * scale)

    canvas.width = photoExportWidth
    canvas.height = photoExportHeight

    if (fitMode === 'contain') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    ctx.save()
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)

    if (fitMode === 'cover') {
      const cropRegion = calculateCropRegion()
      if (!cropRegion) {
        ctx.restore()
        return null
      }

      const { srcX, srcY, srcWidth, srcHeight } = cropRegion

      ctx.drawImage(
        video,
        srcX, srcY, srcWidth, srcHeight,
        0, 0, canvas.width, canvas.height
      )
    } else {
      const drawScale = Math.min(canvas.width / sourceWidth, canvas.height / sourceHeight)
      const drawWidth = sourceWidth * drawScale
      const drawHeight = sourceHeight * drawScale
      const dx = (canvas.width - drawWidth) / 2
      const dy = (canvas.height - drawHeight) / 2
      const mirroredX = canvas.width - dx - drawWidth

      ctx.drawImage(
        video,
        0, 0, sourceWidth, sourceHeight,
        mirroredX, dy, drawWidth, drawHeight
      )
    }
    ctx.restore()

    // High-quality capture to preserve detail before compositing
    // PNG avoids JPEG softness; contain mode preserves full FOV with padding
    return canvas.toDataURL('image/png')
  }, [calculateCropRegion, orientation, targetAspectRatio, useContainFit])

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
    }

    const timer = setTimeout(() => {
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
    }, 0)

    return () => clearTimeout(timer)
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
        <div className="glass rounded-3xl max-w-md w-full text-center px-8 py-12 md:px-10 md:py-14 space-y-5">
          <div className="text-6xl">😢</div>
          <h2 className="text-2xl font-bold">Camera Access Denied</h2>
          <p className="text-[var(--color-text-secondary)] font-medium leading-relaxed">
            {error}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => startCamera()}
              className="px-6 py-3 rounded-xl bg-[#B8001F]/15 hover:bg-[#B8001F]/25 text-[#B8001F] transition-colors font-semibold"
            >
              Try Again
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-xl glass hover:bg-[var(--color-surface)] transition-colors font-semibold"
            >
              Go Back
            </button>
          </div>
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
          <p className="text-[var(--color-text-secondary)] font-semibold">Starting camera...</p>
        </div>
      </div>
    )
  }

  // LARGER preview container styles with slight scale-down for breathing room
  const getPreviewContainerStyle = () => {
    const aspect = targetAspectRatio
    const aspectRatioString = `${orientation?.width || 9}/${orientation?.height || 16}`
    if (isCameraHorizontal) {
      return {
        aspectRatio: aspectRatioString,
        width: '85vw',
        maxWidth: '780px', // ~5% smaller for extra breathing room
        maxHeight: '60vh',
      }
    } else {
      return {
        aspectRatio: aspectRatioString,
        width: '56vw',
        maxWidth: '340px',
        maxHeight: '64vh',
      }
    }
  }

  return (
    <div className="capture-layout min-h-screen flex flex-col items-center justify-center px-4 py-6 relative">
      <div className="capture-stack flex flex-col items-center justify-center w-full">
        {/* Minimal Header - Manrope 700 for title */}
        <div className="capture-header text-center fade-up" style={{ marginBottom: '2px', marginTop: '5px' }}>
          <h2 className="text-xl md:text-2xl font-bold mb-1 transition-opacity duration-300">
            {headerTitle}
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm font-medium">
            {layout?.name} • {orientation?.name}
          </p>
        </div>

        {/* Camera Preview - LARGER */}
        <div className="capture-frame-wrapper relative w-full flex justify-center" style={{ marginBottom: '10px' }}>
          <div 
            className={`relative rounded-2xl overflow-hidden shadow-lg ${useContainFit ? 'bg-black/10' : ''}`}
            style={getPreviewContainerStyle()}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full ${useContainFit ? 'object-contain' : 'object-cover'} camera-mirror`}
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
                  className="text-[120px] md:text-[180px] font-extrabold text-white scale-in"
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

            {/* Captured thumbnails overlay - stays inside frame */}
            {capturedPhotos.length > 0 && (
              <div className="capture-thumbs absolute right-3 top-9 z-20 flex flex-col items-end gap-1.5 px-2 py-1 rounded-full">
                {capturedPhotos.map((photo, i) => (
                  <div 
                    key={i}
                    className="capture-thumb rounded-lg overflow-hidden shadow-md scale-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <img src={photo} alt={`Captured ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Controls - Compact */}
        <div className="flex flex-col items-center">
          {/* Ring Light Toggle - Inline */}
          <div className="capture-light-toggle glass rounded-full flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <span className="text-sm font-semibold">Light</span>
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
              <div 
                className="tone-selector relative flex items-center gap-1 pl-3 border-l border-[var(--color-border)]"
              >
                {toneOptions.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setRingLightTone(tone)}
                    className={`tone-btn w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      ringLightTone.id === tone.id ? 'tone-active' : 'hover:bg-[var(--color-surface)]'
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
          <div className="capture-actions flex items-center justify-center gap-4" style={{ marginTop: '0px' }}>
            {captureState === CAPTURE_STATES.READY && (
              <>
                <button
                  onClick={onBack}
                  className="capture-back-btn rounded-xl glass text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors font-semibold"
                >
                  ← Back
                </button>
                <button
                  onClick={startCapture}
                  className="capture-main-btn rounded-xl btn-primary text-white font-bold text-lg pulse-glow"
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
                className="capture-cancel-btn rounded-xl text-sm glass hover:bg-[var(--color-surface)] transition-colors font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {showCameraReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCameraReminder(false)}
          />
          <div className="relative z-10 max-w-sm w-full">
            <div className="reminder-modal relative rounded-3xl px-6 py-7 shadow-2xl border border-[var(--color-border)] overflow-hidden text-center">
                <button
                  aria-label="Close reminder"
                  onClick={() => setShowCameraReminder(false)}
                  className="absolute top-2 right-3 h-6 w-6 rounded-full bg-red-400 text-white font-bold shadow-lg flex items-center justify-center"
                >
                ×
              </button>
              <p
                className="text-2xl font-extrabold uppercase tracking-[0.12em]"
                style={{
                  paddingTop: "22px",
                  paddingBottom: "6px",
                  color: "var(--color-brand-primary)",
                }}
              >
                Quick reminder
              </p>
              <hr
                aria-hidden="true"
                className="mx-auto border-0"
                style={{
                  width: "70%",
                  height: "1.5px",
                  margin: "0 auto 14px",
                  background:
                    "linear-gradient(90deg, transparent, var(--divider-line, rgba(0,0,0,0.35)), transparent)",
                  opacity: 1,
                }}
              />
              <p
                className="text-md font-semibold text-[var(--color-text-primary)]"
                style={{
                  letterSpacing: "0.08em",
                  lineHeight: "1.6",
                  paddingBottom: "22px",
                }}
              >
                Clean your camera <br />
                before we start :)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoBooth
