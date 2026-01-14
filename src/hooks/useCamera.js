import { useState, useCallback, useRef } from 'react'

/**
 * Custom hook for managing camera access
 * Handles permissions, stream management, and cleanup
 */
function useCamera() {
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const streamRef = useRef(null)

  const startCamera = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser.')
      }

      // Request camera access with front-facing camera preference
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = mediaStream
      setStream(mediaStream)
      setIsLoading(false)
      return mediaStream
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
  }, [])

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

  return {
    stream,
    error,
    isLoading,
    startCamera,
    stopCamera,
    getCameras,
  }
}

export default useCamera
