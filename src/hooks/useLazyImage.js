import { useState, useEffect, useRef } from 'react'

/**
 * Hook for lazy loading images with Intersection Observer
 * Only loads image when it's about to enter the viewport
 */
function useLazyImage(src, options = {}) {
  const supportsIO = typeof window !== 'undefined' && 'IntersectionObserver' in window
  const [isInView, setIsInView] = useState(!supportsIO)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const ref = useRef(null)

  const { rootMargin = '100px', threshold = 0.1 } = options

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Check if IntersectionObserver is supported
    if (!supportsIO) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.unobserve(element)
        }
      },
      { rootMargin, threshold }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [rootMargin, threshold, supportsIO])

  // Preload image when in view
  useEffect(() => {
    if (!isInView || !src) return

    const img = new Image()
    img.onload = () => setIsLoaded(true)
    img.onerror = () => setError(true)
    img.src = src
  }, [isInView, src])

  return {
    ref,
    isInView,
    isLoaded,
    error,
    shouldLoad: isInView,
  }
}

export default useLazyImage
