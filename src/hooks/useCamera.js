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
  const isIPhone = typeof window !== 'undefined' && (
    /iPhone|iPod/i.test(userAgent) ||
    (isIOS && Math.min(window.screen?.width || 0, window.screen?.height || 0) < 768)
  )

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

      const makePreset = (width, height, aspectSetting, sizeConstraint = 'ideal', advancedOverrides = null) => ({
        video: {
          facingMode: 'user',
          width: { [sizeConstraint]: width },
          height: { [sizeConstraint]: height },
          ...(aspectSetting ? { aspectRatio: aspectSetting } : {}),
          ...(advancedOverrides ? { advanced: advancedOverrides } : {}),
          ...(isIPhone ? { resizeMode: 'none' } : {}),
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      })

      const useExactAspect = typeof aspectRatio === 'number' && isMobile && !isIOS
      const exactAspect = useExactAspect ? { exact: aspectRatio } : null
      const idealAspect = typeof aspectRatio === 'number' ? { ideal: aspectRatio } : null

      let presets = []

      if (isIPhone && isPortrait) {
        const portraitAdvanced = (width, height, aspect) => ([
          { width, height },
          { aspectRatio: aspect },
        ])

        presets = [
          makePreset(sizePresets[0][0], sizePresets[0][1], { exact: aspectRatio }, 'exact', portraitAdvanced(sizePresets[0][0], sizePresets[0][1], aspectRatio)),
          makePreset(sizePresets[1][0], sizePresets[1][1], { exact: aspectRatio }, 'exact', portraitAdvanced(sizePresets[1][0], sizePresets[1][1], aspectRatio)),
          makePreset(sizePresets[2][0], sizePresets[2][1], { exact: aspectRatio }, 'exact', portraitAdvanced(sizePresets[2][0], sizePresets[2][1], aspectRatio)),
          makePreset(sizePresets[0][0], sizePresets[0][1], { ideal: aspectRatio }, 'ideal', portraitAdvanced(sizePresets[0][0], sizePresets[0][1], aspectRatio)),
          makePreset(sizePresets[1][0], sizePresets[1][1], { ideal: aspectRatio }, 'ideal', portraitAdvanced(sizePresets[1][0], sizePresets[1][1], aspectRatio)),
          makePreset(sizePresets[2][0], sizePresets[2][1], { ideal: aspectRatio }, 'ideal', portraitAdvanced(sizePresets[2][0], sizePresets[2][1], aspectRatio)),
          {
            video: {
              facingMode: 'user',
              ...(isIPhone ? { resizeMode: 'none' } : {}),
              frameRate: { ideal: 30, max: 30 },
            },
            audio: false,
          },
        ]
      } else {
        // Try high → medium (with aspect) → fallback (no aspect)
        const aspectCandidates = exactAspect
          ? [exactAspect, idealAspect, null]
          : [idealAspect, idealAspect, null]

        presets = sizePresets.map((preset, index) => (
          makePreset(preset[0], preset[1], aspectCandidates[index] || null)
        ))
      }

      let lastError = null
      for (const constraints of presets) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
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
  }, [aspectRatio, isMobile])

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
