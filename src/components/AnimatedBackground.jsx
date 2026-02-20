import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../hooks/useTheme.jsx'

const BLOB_SOURCES = {
  dark: [
    '/assets/blobs/blob-1-dark.png',
    '/assets/blobs/blob-2-dark.png',
    '/assets/blobs/blob-3-dark.png',
    '/assets/blobs/blob-4-dark.png',
    '/assets/blobs/blob-5-dark.png',
    '/assets/blobs/blob-6-dark.png',
    '/assets/blobs/blob-7-dark.png',
  ],
  light: [
    '/assets/blobs/blob-1-light.png',
    '/assets/blobs/blob-2-light.png',
    '/assets/blobs/blob-3-light.png',
    '/assets/blobs/blob-4-light.png',
    '/assets/blobs/blob-5-light.png',
    '/assets/blobs/blob-6-light.png',
    '/assets/blobs/blob-7-light.png',
  ],
}

const BLOB_LAYOUT = [
  {
    key: 'blob-1-top-left',
    srcIndex: 0,
 anchor: { top: '-25vh', left: '-11vw' },
    anchorWide: { top: '-23vh', left: '-13vw' },
    anchorSmall: { top: '-20vh', left: '-32vw' },
    size: {
      base: { w: 'clamp(520px, 52vw, 980px)', h: 'clamp(420px, 50vh, 780px)' },
      wide: { w: 'clamp(580px, 57vw, 1080px)', h: 'clamp(460px, 54vh, 860px)' },
      small: { w: 'clamp(400px, 84vw, 760px)', h: 'clamp(300px, 46vh, 620px)' },
    },
    rotate: -75,
    scale: 1.25,
    z: 1,
    radius: 420,
    strength: 18,
  },
  {
    key: 'blob-2-right-sweep',
    srcIndex: 1,
    anchor: { top: '30vh', right: '-21vw' },
    anchorWide: { top: '20vh', right: '-50vw' },
    anchorSmall: { top: '22vh', right: '-62.5vw' },
    size: {
      base: { w: 'clamp(520px, 52vw, 980px)', h: 'clamp(300px, 36vh, 560px)' },
      wide: { w: 'clamp(580px, 57vw, 1080px)', h: 'clamp(340px, 40vh, 620px)' },
      small: { w: 'clamp(400px, 82vw, 740px)', h: 'clamp(250px, 30vh, 440px)' },
    },
    rotate: 27,
    scale: 2.5,
    z: 1,
    flipX: true,
    radius: 390,
    strength: 17,
  },
  {
    key: 'blob-6-bottom-left',
    srcIndex: 5,
    anchor: { bottom: '41vh', left: '-18vw' },
    anchorWide: { bottom: '42vh', left: '-22vw' },
    anchorSmall: { bottom: '44vh', left: '-40vw' },
    size: {
      base: { w: 'clamp(520px, 52vw, 980px)', h: 'clamp(220px, 28vh, 430px)' },
      wide: { w: 'clamp(580px, 57vw, 1080px)', h: 'clamp(250px, 31vh, 480px)' },
      small: { w: 'clamp(420px, 86vw, 780px)', h: 'clamp(190px, 24vh, 360px)' },
    },
    rotate: -85,
    scale: 6,
    z: -1,
    radius: 420,
    strength: 20,
  },
  {
    key: 'blob-4-top-right',
    srcIndex: 3,
    anchor: { top: '-9vh', right: '-10vw' },
    anchorWide: { top: '-11vh', right: '-12vw' },
    anchorSmall: { top: '-7vh', right: '-35vw' },
    size: {
      base: { w: 'clamp(520px, 52vw, 980px)', h: 'clamp(360px, 44vh, 700px)' },
      wide: { w: 'clamp(580px, 57vw, 1080px)', h: 'clamp(390px, 48vh, 760px)' },
      small: { w: 'clamp(390px, 80vw, 720px)', h: 'clamp(300px, 44vh, 560px)' },
    },
    rotate: 2,
    scale: 2,
    z: 1,
    radius: 420,
    strength: 19,
  },
  {
    key: 'blob-7-right-mid',
    srcIndex: 6,
    anchor: { top: '60vh', right: '-16vw' },
    anchorWide: { top: '49vh', right: '-18vw' },
    anchorSmall: { top: '66vh', right: '-31vw' },
    size: {
      base: { w: 'clamp(460px, 44vw, 860px)', h: 'clamp(360px, 46vh, 760px)' },
      wide: { w: 'clamp(520px, 49vw, 960px)', h: 'clamp(400px, 50vh, 820px)' },
      small: { w: 'clamp(360px, 72vw, 680px)', h: 'clamp(300px, 44vh, 560px)' },
    },
    rotate: -162,
    scale: 1.5,
    z: 4,
    radius: 360,
    strength: 16,
  },
  {
    key: 'blob-5-bottom-right',
    srcIndex: 4,
    anchor: { bottom: '30vh', right: '-16vw' },
    anchorWide: { bottom: '21vh', right: '-18vw' },
    anchorSmall: { bottom: '30vh', right: '-45vw' },
    size: {
      base: { w: 'clamp(520px, 52vw, 980px)', h: 'clamp(260px, 34vh, 520px)' },
      wide: { w: 'clamp(580px, 57vw, 1080px)', h: 'clamp(290px, 38vh, 560px)' },
      small: { w: 'clamp(410px, 84vw, 760px)', h: 'clamp(220px, 30vh, 420px)' },
    },
    rotate: 90,
    scale: 3,
    flipX: true,
    z: 2,
    radius: 420,
    strength: 21,
  },
  {
    key: 'blob-3-left-mid',
    srcIndex: 2,
    anchor: { top: '76vh', left: '-7.5vw' },
    anchorWide: { top: '34vh', left: '-7vw' },
    anchorSmall: { top: '74vh', left: '-35vw' },
    size: {
      base: { w: 'clamp(420px, 42vw, 860px)', h: 'clamp(180px, 24vh, 360px)' },
      wide: { w: 'clamp(470px, 46vw, 940px)', h: 'clamp(200px, 26vh, 400px)' },
      small: { w: 'clamp(340px, 70vw, 640px)', h: 'clamp(150px, 18vh, 300px)' },
    },
    rotate: 0,
    scale: 4,
    z: 0,
    radius: 320,
    strength: 11,
    flipX: true,

  },
]

const BLOB_DARK_GLOW = {
  0: { primary: 'rgba(102, 165, 255, 0.24)', secondary: 'rgba(74, 129, 255, 0.14)' }, // blob 1: blue
  1: { primary: 'rgba(216, 128, 255, 0.24)', secondary: 'rgba(255, 124, 204, 0.14)' }, // blob 2: purple/pink
  2: { primary: 'rgba(216, 128, 255, 0.24)', secondary: 'rgba(255, 124, 204, 0.14)' }, // blob 3: purple/pink
  3: { primary: 'rgba(104, 168, 255, 0.24)', secondary: 'rgba(70, 124, 242, 0.14)' }, // blob 4: blue
  4: { primary: 'rgba(255, 216, 114, 0.22)', secondary: 'rgba(255, 182, 84, 0.12)' }, // blob 5: gold
  5: { primary: 'rgba(255, 214, 112, 0.24)', secondary: 'rgba(255, 184, 86, 0.14)' }, // blob 6: gold yellow
  6: { primary: 'rgba(126, 174, 255, 0.22)', secondary: 'rgba(232, 136, 255, 0.14)' }, // blob 7: blue/pink
}

const BLOB_LIGHT_GLOW = {
  0: { primary: 'rgba(133, 208, 255, 0.56)', secondary: 'rgba(212, 188, 255, 0.36)' }, // baby blue / baby purple
  1: { primary: 'rgba(255, 182, 223, 0.54)', secondary: 'rgba(212, 188, 255, 0.34)' }, // baby pink / baby purple
  2: { primary: 'rgba(255, 182, 223, 0.54)', secondary: 'rgba(212, 188, 255, 0.34)' }, // baby pink / baby purple
  3: { primary: 'rgba(133, 208, 255, 0.56)', secondary: 'rgba(191, 223, 255, 0.34)' }, // baby blue
  4: { primary: 'rgba(255, 218, 118, 0.52)', secondary: 'rgba(255, 235, 176, 0.32)' }, // gold yellow
  5: { primary: 'rgba(255, 212, 102, 0.54)', secondary: 'rgba(255, 230, 150, 0.34)' }, // gold yellow
  6: { primary: 'rgba(133, 208, 255, 0.52)', secondary: 'rgba(255, 182, 223, 0.34)' }, // baby blue / baby pink
}

const CENTER_EASING = 0.16

function AnimatedBackground() {
  const { isDark } = useTheme()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [viewportTier, setViewportTier] = useState({ wide: false, small: false })

  const blobRefs = useRef([])
  const centersRef = useRef(BLOB_LAYOUT.map(() => ({ x: 0, y: 0 })))
  const currentOffsetsRef = useRef(BLOB_LAYOUT.map(() => ({ x: 0, y: 0 })))
  const pointerRef = useRef({ x: 0, y: 0, active: false })
  const rafRef = useRef(0)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPref = () => setPrefersReducedMotion(mediaQuery.matches)
    updateMotionPref()
    mediaQuery.addEventListener('change', updateMotionPref)
    return () => mediaQuery.removeEventListener('change', updateMotionPref)
  }, [])

  useEffect(() => {
    const updateTier = () => {
      const width = window.innerWidth
      const nextWide = width >= 1536
      const nextSmall = width < 1024
      setViewportTier((prev) => (
        prev.wide === nextWide && prev.small === nextSmall
          ? prev
          : { wide: nextWide, small: nextSmall }
      ))
    }

    updateTier()
    window.addEventListener('resize', updateTier)
    return () => window.removeEventListener('resize', updateTier)
  }, [])

  useEffect(() => {
    let frame = 0

    const updateCenters = () => {
      centersRef.current = BLOB_LAYOUT.map((_, index) => {
        const node = blobRefs.current[index]
        if (!node) return { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 }
        const rect = node.getBoundingClientRect()
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      })
    }

    const onResize = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(updateCenters)
    }

    frame = window.requestAnimationFrame(updateCenters)
    window.addEventListener('resize', onResize)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [viewportTier.wide, viewportTier.small])

  useEffect(() => {
    const applyOffsets = () => {
      BLOB_LAYOUT.forEach((_, index) => {
        const node = blobRefs.current[index]
        if (!node) return
        const { x, y } = currentOffsetsRef.current[index]
        node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`
      })
    }

    const resetOffsets = () => {
      currentOffsetsRef.current.forEach((offset) => {
        offset.x = 0
        offset.y = 0
      })
      applyOffsets()
    }

    if (prefersReducedMotion) {
      resetOffsets()
      return
    }

    const onPointerMove = (event) => {
      if (event.pointerType === 'touch') return
      pointerRef.current.x = event.clientX
      pointerRef.current.y = event.clientY
      pointerRef.current.active = true
    }

    const onPointerLeave = () => {
      pointerRef.current.active = false
    }

    const tick = () => {
      const pointer = pointerRef.current

      BLOB_LAYOUT.forEach((blob, index) => {
        const current = currentOffsetsRef.current[index]
        const center = centersRef.current[index]
        const effectiveX = center.x + current.x
        const effectiveY = center.y + current.y

        let targetX = 0
        let targetY = 0

        if (pointer.active) {
          const dx = pointer.x - effectiveX
          const dy = pointer.y - effectiveY
          const distance = Math.hypot(dx, dy)

          if (distance > 0 && distance < blob.radius) {
            const intensity = 1 - distance / blob.radius
            const force = intensity * intensity * blob.strength
            targetX = (-dx / distance) * force
            targetY = (-dy / distance) * force
          }
        }

        current.x += (targetX - current.x) * CENTER_EASING
        current.y += (targetY - current.y) * CENTER_EASING

        if (Math.abs(current.x) < 0.01) current.x = 0
        if (Math.abs(current.y) < 0.01) current.y = 0
      })

      applyOffsets()
      rafRef.current = window.requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', onPointerLeave)
    window.addEventListener('blur', onPointerLeave)

    rafRef.current = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(rafRef.current)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('blur', onPointerLeave)
      resetOffsets()
    }
  }, [prefersReducedMotion])

  const resolvePlacement = (blob) => {
    const anchor = viewportTier.small
      ? (blob.anchorSmall || blob.anchor)
      : (viewportTier.wide ? (blob.anchorWide || blob.anchor) : blob.anchor)
    const size = viewportTier.small
      ? (blob.size.small || blob.size.base)
      : (viewportTier.wide ? (blob.size.wide || blob.size.base) : blob.size.base)

    return { ...anchor, width: size.w, height: size.h }
  }

  const themeBlobs = isDark ? BLOB_SOURCES.dark : BLOB_SOURCES.light
  const layerShift = viewportTier.small ? '-1.25vw' : '-2vw'

  const ambientLayerStyle = isDark
    ? {
        background: `
          radial-gradient(1500px 980px at 50% 52%, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.78) 57%, rgba(0, 0, 0, 1) 100%),
          radial-gradient(980px 700px at 50% 90%, rgba(0, 0, 0, 0.16) 0%, rgba(0, 0, 0, 0) 76%)
        `,
      }
    : {
        background: `
          radial-gradient(1300px 800px at 50% 46%, rgba(255, 255, 255, 0.985) 0%, rgba(249, 252, 255, 0.93) 52%, rgba(239, 246, 255, 0.82) 100%),
          radial-gradient(670px 450px at 16% 14%, rgba(165, 242, 255, 0.56) 0%, rgba(165, 242, 255, 0) 74%),
          radial-gradient(700px 460px at 85% 18%, rgba(190, 202, 255, 0.5) 0%, rgba(190, 202, 255, 0) 72%),
          radial-gradient(780px 560px at 84% 86%, rgba(160, 236, 245, 0.44) 0%, rgba(160, 236, 245, 0) 75%),
          radial-gradient(730px 530px at 14% 86%, rgba(195, 206, 255, 0.42) 0%, rgba(195, 206, 255, 0) 74%)
        `,
      }

  const centerWashStyle = isDark
    ? {
        background:
          'radial-gradient(58vw 44vh at 50% 50%, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.08) 56%, rgba(0, 0, 0, 0) 80%)',
      }
    : {
        background:
          'radial-gradient(60vw 44vh at 50% 50%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.56) 56%, rgba(255, 255, 255, 0) 80%)',
      }

  const vignetteStyle = isDark
    ? {
        background:
          'radial-gradient(circle at center, rgba(0, 0, 0, 0) 42%, rgba(0, 0, 0, 0.74) 100%)',
      }
    : {
        background:
          'radial-gradient(circle at center, rgba(255, 255, 255, 0) 52%, rgba(203, 217, 244, 0.22) 100%)',
      }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: isDark ? '#000000' : '#f9fbff' }}
      />
      <div className="absolute inset-0" style={ambientLayerStyle} />
      <div className="absolute inset-0" style={centerWashStyle} />

      <div className="absolute inset-0" style={{ transform: `translate3d(${layerShift}, 0, 0)` }}>
        {BLOB_LAYOUT.map((blob, index) => {
          const src = themeBlobs[blob.srcIndex]
          const placement = resolvePlacement(blob)
          const sx = (blob.flipX ? -1 : 1) * blob.scale
          const sy = (blob.flipY ? -1 : 1) * blob.scale
          const darkGlow = BLOB_DARK_GLOW[blob.srcIndex] || BLOB_DARK_GLOW[0]
          const lightGlow = BLOB_LIGHT_GLOW[blob.srcIndex] || BLOB_LIGHT_GLOW[0]

          return (
            <div
              key={blob.key}
              ref={(node) => {
                blobRefs.current[index] = node
              }}
              className="absolute will-change-transform overflow-visible"
              style={{
                ...placement,
                zIndex: blob.z,
                transform: 'translate3d(0px, 0px, 0px)',
              }}
            >
              <div
                className="absolute inset-0 overflow-visible"
                style={{
                  transform: `rotate(${blob.rotate}deg) scale(${sx}, ${sy})`,
                  transformOrigin: 'center center',
                }}
              >
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-contain"
                  style={{
                    opacity: isDark ? 0.93 : 0.97,
                    mixBlendMode: isDark ? 'normal' : 'normal',
                    filter: isDark
                      ? `brightness(0.92) contrast(1.1) saturate(1.02) drop-shadow(0 8px 17px rgba(0,0,0,0.78)) drop-shadow(0 0 5px ${darkGlow.primary}) drop-shadow(0 0 10px ${darkGlow.secondary})`
                      : `brightness(1.04) saturate(1.08) drop-shadow(0 5px 10px rgba(130, 154, 196, 0.22)) drop-shadow(0 0 8px ${lightGlow.primary}) drop-shadow(0 0 14px ${lightGlow.secondary})`,
                  }}
                />
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-contain"
                  style={{
                    opacity: isDark ? 0.13 : 0.22,
                    mixBlendMode: isDark ? 'screen' : 'overlay',
                    filter: isDark
                      ? `brightness(1.05) saturate(1.03) drop-shadow(0 0 3px ${darkGlow.primary}) drop-shadow(0 0 6px ${darkGlow.secondary})`
                      : `brightness(1.12) saturate(1.14) drop-shadow(0 0 5px ${lightGlow.primary}) drop-shadow(0 0 9px ${lightGlow.secondary})`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="absolute inset-0" style={vignetteStyle} />
    </div>
  )
}

export default AnimatedBackground
