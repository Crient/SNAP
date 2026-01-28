import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Custom hook for managing camera access
 * Handles permissions, stream management, and cleanup
 * Optimized for mobile performance
 */
function useCamera({ aspectRatio } = {}) {
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const streamRef = useRef(null)
  const lastStreamSettingsRef = useRef(null)
  
  // Detect if mobile
  const isMobile = typeof window !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768
  )
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
  const isIPhone = typeof navigator !== 'undefined' && /iPhone|iPod/i.test(userAgent)

  const startCamera = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser.')
      }

      const isPortrait = typeof aspectRatio === 'number' ? aspectRatio < 1 : false
      const sizePresets = isPortrait
        ? [
            [1080, 1920],
            [720, 1280],
            [540, 960],
          ]
        : [
            [1920, 1080],
            [1280, 720],
            [960, 540],
          ]

      const makePreset = (width, height, aspectSetting, sizeConstraint = 'ideal') => ({
        video: {
          facingMode: 'user',
          width: { [sizeConstraint]: width },
          height: { [sizeConstraint]: height },
          ...(aspectSetting ? { aspectRatio: aspectSetting } : {}),
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      })

      const useExactAspect = typeof aspectRatio === 'number' && isMobile && !isIPhone
      const exactAspect = useExactAspect ? { exact: aspectRatio } : null
      const idealAspect = typeof aspectRatio === 'number' ? { ideal: aspectRatio } : null

      const highResSizes = [
        [2560, 1440],
        [1920, 1080],
        [1440, 1080],
        [1280, 720],
      ]
      const highResAspect = isIPhone ? null : idealAspect
      const highResPresets = highResSizes.map(([width, height]) => (
        makePreset(width, height, highResAspect)
      ))

      let presets = []

      presets = presets.concat(highResPresets)

      if (isIPhone && isPortrait) {
        presets = presets.concat([
          makePreset(1440, 1080, null, 'exact'),
          makePreset(1440, 1080, null, 'ideal'),
          makePreset(1280, 960, null, 'exact'),
          makePreset(1280, 960, null, 'ideal'),
          makePreset(640, 480, null, 'exact'),
          makePreset(640, 480, null, 'ideal'),
          makePreset(1280, 720, null, 'ideal'),
        ])
      } else if (isIPhone && !isPortrait) {
        presets = presets.concat([
          makePreset(1440, 1080, null, 'exact'),
          makePreset(1440, 1080, null, 'ideal'),
          makePreset(1280, 960, null, 'exact'),
          makePreset(1280, 960, null, 'ideal'),
          makePreset(640, 480, null, 'exact'),
          makePreset(640, 480, null, 'ideal'),
          makePreset(1920, 1080, null, 'ideal'),
          makePreset(1280, 720, null, 'ideal'),
        ])
      } else {
        // Try high → medium (with aspect) → fallback (no aspect)
        const aspectCandidates = exactAspect
          ? [exactAspect, idealAspect, null]
          : [idealAspect, idealAspect, null]

        presets = presets.concat(sizePresets.map((preset, index) => (
          makePreset(preset[0], preset[1], aspectCandidates[index] || null)
        )))
      }

      let lastError = null
      for (const constraints of presets) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
          if (import.meta.env?.DEV && isIPhone && isPortrait) {
            const settings = mediaStream.getVideoTracks?.()[0]?.getSettings?.() || {}
            lastStreamSettingsRef.current = settings
            // eslint-disable-next-line no-console
            console.log('[camera] iPhone portrait stream settings', {
              width: settings.width,
              height: settings.height,
              aspectRatio: settings.aspectRatio,
            })
          } else {
            const settings = mediaStream.getVideoTracks?.()[0]?.getSettings?.() || {}
            lastStreamSettingsRef.current = settings
          }
          streamRef.current = mediaStream
          setStream(mediaStream)
          setIsLoading(false)
          return mediaStream
        } catch (err) {
          lastError = err
          // If user blocked permission, stop retrying
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            throw err
          }
          // Otherwise, try next preset
        }
      }

      // If all presets failed, throw last error to show a message
      throw lastError || new Error('Failed to access camera.')
    } catch (err) {
      setIsLoading(false)
      
      // Handle specific error types
      let errorMessage = 'Failed to access camera.'
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission was denied. Please allow camera access in your browser settings.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application.'
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Could not find a camera matching the requirements.'
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      return null
    }
  }, [aspectRatio, isIPhone, isIOS, isMobile])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      streamRef.current = null
      setStream(null)
    }
  }, [])

  // Get list of available cameras
  const getCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.filter(device => device.kind === 'videoinput')
    } catch {
      return []
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return {
    stream,
    error,
    isLoading,
    startCamera,
    stopCamera,
    getCameras,
    isMobile,
    isIOS,
    isIPhone,
  }
}

export default useCamera
