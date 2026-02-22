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
  
  const { stream, error, isLoading, startCamera, stopCamera, isIPhone } = useCamera({ aspectRatio: targetAspectRatio })
  
  const [captureState, setCaptureState] = useState(CAPTURE_STATES.READY)
  const [countdown, setCountdown] = useState(3)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [capturedPhotos, setCapturedPhotos] = useState([])
  const [showFlash, setShowFlash] = useState(false)
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 })
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

      const updateDimensions = () => {
        setVideoDimensions({
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        })
      }

      videoRef.current.onloadedmetadata = updateDimensions
      videoRef.current.onresize = updateDimensions
    }
  }, [stream])

  const isIPhonePortraitTile = isIPhone && targetAspectRatio < 1
  const IPHONE_UPWARD_BIAS = 0.1

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
      const availableCrop = videoHeight - srcHeight
      const biasOffset = isIPhonePortraitTile ? (availableCrop * IPHONE_UPWARD_BIAS) : 0
      srcY = Math.max(0, (availableCrop / 2) - biasOffset)
    }

    return { srcX, srcY, srcWidth, srcHeight }
  }, [videoDimensions, targetAspectRatio, isIPhonePortraitTile])

  // Capture a single photo with proper cropping
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

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

    ctx.save()
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)

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
    ctx.restore()

    // High-quality capture to preserve detail before compositing
    // PNG avoids JPEG softness; source is already cropped to target AR
    return canvas.toDataURL('image/png')
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
        <div className="glass relative max-w-md w-full rounded-[30px] border border-[var(--color-border)] px-6 py-7 md:px-8 md:py-8 text-center shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-brand-primary)]/55 to-transparent pointer-events-none" />
          <div className="mt-2 mb-5 flex justify-center">
            <div className="h-14 w-14 rounded-2xl border border-[var(--color-border)] bg-[var(--toggle-bg)] flex items-center justify-center"                 
            style={{marginTop:"20px", marginBottom:"10px"}}>
              
              <svg
                viewBox="0 0 24 24"
                width="26"
                height="26"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-[var(--color-brand-primary)]"
                aria-hidden="true"

              >
                <path d="M4 7h3l2-2h6l2 2h3v11H4z" />
                <circle cx="12" cy="13" r="3.5" />
                <path d="M4 4l16 16" />
              </svg>
            </div>
          </div>
          <h2 className="text-center text-[26px] leading-[1] font-extrabold tracking-[-0.01em] text-[var(--color-text-primary)]"
          style={{marginTop:"10px", marginBottom:"10px"}}>
            Camera Access Denied
          </h2>
          <div className="mt-4 flex justify-center">
            <p className="w-full max-w-[32ch] text-center text-[13px] font-semibold leading-[1.45] text-[var(--color-text-secondary)]">
              {error}
            </p>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-4 px-1"
          style={{marginBottom: "20px", marginTop: "10px"}}>
              <button
                onClick={() => startCamera()}
                className="h-9 rounded-2xl text-[12px] font-bold text-white transition-all duration-300 hover:-translate-y-[1px] active:translate-y-0"
                style={{
                  background: 'linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-brand-secondary) 100%)',
                  boxShadow: '0 8px 20px rgba(184, 0, 31, 0.22)',
                  marginLeft: '25px',
                }}
              >
                Try Again
              </button>
              <button
                onClick={onBack}
                className="h-9 rounded-2xl border border-[var(--color-border)] bg-[var(--toggle-bg)] text-[12px] font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                style={{marginRight: '25px'}}
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
    const previewAspectRatio = targetAspectRatio || (orientation?.aspectRatio || (9 / 16))
    if (isCameraHorizontal) {
      return {
        aspectRatio: previewAspectRatio,
        width: '85vw',
        maxWidth: '780px', // ~5% smaller for extra breathing room
        maxHeight: '60vh',
      }
    } else {
      return {
        aspectRatio: previewAspectRatio,
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
            className="relative rounded-2xl overflow-hidden shadow-lg"
            style={getPreviewContainerStyle()}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover camera-mirror"
              style={isIPhonePortraitTile ? { objectPosition: `50% ${50 - (IPHONE_UPWARD_BIAS * 100)}%` } : undefined}
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
          <div className="glass relative max-w-sm w-full rounded-[30px] border border-[var(--color-border)] px-6 py-7 text-center shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-brand-primary)]/55 to-transparent pointer-events-none" />
            <button
              aria-label="Close reminder"
              onClick={() => setShowCameraReminder(false)}
              className="absolute top-3 right-3 h-6 w-6 rounded-full bg-red-400 text-white font-bold shadow-lg flex items-center justify-center"
            >
              ×
            </button>
            <div className="mt-2 mb-4 flex justify-center">
              <div className="h-14 w-14 rounded-2xl border border-[var(--color-border)] bg-[var(--toggle-bg)] flex items-center justify-center"
              style={{marginTop:"20px", marginBottom:"10px"}}>
                <svg
                  viewBox="0 0 24 24"
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-[var(--color-brand-primary)]"
                  aria-hidden="true"
                >
                  <path d="M4 7h3l2-2h6l2 2h3v11H4z" />
                  <circle cx="12" cy="13" r="3.5" />
                  <path d="M19 3l.8 1.6L21.5 5l-1.7.4L19 7l-.8-1.6L16.5 5l1.7-.4z" />
                </svg>
              </div>
            </div>
            <h3 className="text-center text-[26px] leading-[1] font-extrabold tracking-[-0.01em] text-[var(--color-brand-primary)]"
            style={{marginTop:"10px", marginBottom:"10px"}}>
              Quick Reminder
            </h3>
            <div className="mt-3 flex justify-center">
              <p className="w-full max-w-[32ch] text-center text-[13px] font-semibold leading-[1.45] text-[var(--color-text-primary)]"
               style={{marginBottom: "25px", marginTop: "-5px"}}>
                Don&apos;t forget to clean your camera before we start.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoBooth
