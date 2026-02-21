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

const GRID_DECOR_SOURCES = [
  '/assets/Dots-Grid/Dot-Grid-1.png',
  '/assets/Dots-Grid/Dot-Grid-2.png',
  '/assets/Dots-Grid/Dot-Grid-3.png',
  '/assets/Dots-Grid/Dot-Grid-4.png',
  '/assets/Dots-Grid/Shape-Group-1.png',
  '/assets/Dots-Grid/Shape-Group-2.png',
]

const THEME_FADE_MS = 220
const THEME_FADE_TRANSITION = `opacity ${THEME_FADE_MS}ms ease`
const PRELOAD_IMAGE_SOURCES = [
  ...BLOB_SOURCES.dark,
  ...BLOB_SOURCES.light,
  ...GRID_DECOR_SOURCES,
]

const BLOB_LAYOUT = [
  {
    key: 'blob-1-top-left',
    srcIndex: 0,
    anchor: { top: '-25vh', left: '-11vw' },
    anchorWide: { top: '-24vh', left: '-15vw' },
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
    anchorWide: { top: '28.5vh', right: '-29.5vw' },
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
    anchorWide: { bottom: '41.5vh', left: '-22.5vw' },
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
    anchorWide: { top: '-8.5vh', right: '-15vw' },
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
    anchorWide: { top: '61vh', right: '-19vw' },
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
    anchorWide: { bottom: '30vh', right: '-22vw' },
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
    anchorWide: { top: '75.5vh', left: '-13vw' },
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

const GRID_DECOR_LAYOUT = [
  {
    key: 'grid-1-arc-top',
    srcIndex: 0,
    anchor: { top: '-27vh', right: '6vw' },
    anchorWide: { top: '-24vh', right: '19vw' },
    anchorSmall: { top: '-16vh', right: '-9vw' },
    size: {
      base: { w: 'clamp(420px, 32vw, 680px)', h: 'clamp(420px, 32vw, 680px)' },
      wide: { w: 'clamp(500px, 30vw, 760px)', h: 'clamp(500px, 30vw, 760px)' },
      small: { w: 'clamp(280px, 54vw, 420px)', h: 'clamp(280px, 54vw, 420px)' },
    },
    rotate: 10,
    scale: 0.9,
    z: 6,
    radius: 280,
    strength: 9,
    opacityDark: 0.18,
    opacityLight: 0.08,
  },
  {
    key: 'grid-2-right-top',
    srcIndex: 1,
    anchor: { bottom: '4vh', left: '3vw' },
    anchorWide: { bottom: '4vh', left: '5vw' },
    anchorSmall: { bottom: '3vh', left: '5vw' },
    size: {
      base: { w: 'clamp(180px, 14vw, 300px)', h: 'clamp(180px, 14vw, 300px)' },
      wide: { w: 'clamp(210px, 13vw, 340px)', h: 'clamp(210px, 13vw, 340px)' },
      small: { w: 'clamp(130px, 28vw, 230px)', h: 'clamp(130px, 28vw, 230px)' },
    },
    rotate: 0,
    scale: 1.25,
    z: 8,
    radius: 180,
    strength: 7,
    opacityDark: 0.35,
    opacityLight: 0.10,
  },

  {
    key: 'grid-4-left-bottom',
    srcIndex: 3,
    anchor: { bottom: '0vh', right: '2.5vw' },
    anchorWide: { bottom: '7vh', right: '3.5vw' },
    anchorSmall: { bottom: '-2vh', right: '-8vw' },
    size: {
      base: { w: 'clamp(220px, 16vw, 330px)', h: 'clamp(220px, 16vw, 330px)' },
      wide: { w: 'clamp(250px, 15vw, 360px)', h: 'clamp(250px, 15vw, 360px)' },
      small: { w: 'clamp(150px, 32vw, 250px)', h: 'clamp(150px, 32vw, 250px)' },
    },
    rotate: 0,
    scale: 2,
    z: 7,
    radius: 220,
    strength: 8,
    opacityDark: 0.26,
    opacityLight: 0.15,
    underBlobLayer: true,
  },
  {
    key: 'shape-group-1-center-right',
    srcIndex: 4,
    anchor: { top: '41vh', right: '27vw' },
    anchorWide: { top: '40vh', right: '29vw' },
    anchorSmall: { top: '38vh', right: '10vw' },
    size: {
      base: { w: 'clamp(110px, 9vw, 180px)', h: 'clamp(110px, 9vw, 180px)' },
      wide: { w: 'clamp(130px, 8.5vw, 200px)', h: 'clamp(130px, 8.5vw, 200px)' },
      small: { w: 'clamp(90px, 20vw, 140px)', h: 'clamp(90px, 20vw, 140px)' },
    },
    rotate: 4,
    scale: 1,
    z: 8,
    radius: 180,
    strength: 7,
    opacityDark: 0.23,
    opacityLight: 0.12,
  },
  {
    key: 'shape-group-2-bottom-right',
    srcIndex: 5,
    anchor: { top: '17vh', left: '5vw' },
    anchorWide: { top: '5vh', left: '4.5vw' },
    anchorSmall: { top: '15vh', left: '-4vw' },
    size: {
      base: { w: 'clamp(160px, 13vw, 250px)', h: 'clamp(160px, 13vw, 250px)' },
      wide: { w: 'clamp(190px, 12vw, 280px)', h: 'clamp(190px, 12vw, 280px)' },
      small: { w: 'clamp(120px, 27vw, 210px)', h: 'clamp(120px, 27vw, 210px)' },
    },
    rotate: 5,
    scale: 1,
    z: 0,
    radius: 220,
    strength: 8,
    opacityDark: 0.29,
    opacityLight: 0.12,
    blobStackLayer: true,
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

const POINTER_FOLLOW_EASING = 0.14
const FORCE_SCALE = 0.72
const SPRING_STIFFNESS = 0.095
const SPRING_DAMPING = 0.82
const VIEWPORT_TIER = {
  smallMaxWidth: 1024,
  wideMinWidth: 1900,
  wideMinAspectRatio: 1.9,
}

function AnimatedBackground({ interactive = true }) {
  const { isDark } = useTheme()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isThemeSwitching, setIsThemeSwitching] = useState(false)
  const [viewportTier, setViewportTier] = useState({ wide: false, small: false })

  const blobRefs = useRef([])
  const gridRefs = useRef([])
  const blobCentersRef = useRef(BLOB_LAYOUT.map(() => ({ x: 0, y: 0 })))
  const gridCentersRef = useRef(GRID_DECOR_LAYOUT.map(() => ({ x: 0, y: 0 })))
  const blobOffsetsRef = useRef(BLOB_LAYOUT.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 })))
  const gridOffsetsRef = useRef(GRID_DECOR_LAYOUT.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 })))
  const pointerRef = useRef({ x: 0, y: 0, active: false })
  const smoothedPointerRef = useRef({ x: 0, y: 0, ready: false })
  const rafRef = useRef(0)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPref = () => setPrefersReducedMotion(mediaQuery.matches)
    updateMotionPref()
    mediaQuery.addEventListener('change', updateMotionPref)
    return () => mediaQuery.removeEventListener('change', updateMotionPref)
  }, [])

  useEffect(() => {
    setIsThemeSwitching(true)
    const timer = window.setTimeout(() => {
      setIsThemeSwitching(false)
    }, THEME_FADE_MS + 120)
    return () => window.clearTimeout(timer)
  }, [isDark])

  useEffect(() => {
    const preloadedImages = PRELOAD_IMAGE_SOURCES.map((src) => {
      const img = new Image()
      img.decoding = 'async'
      img.src = src
      if (img.decode) {
        img.decode().catch(() => {})
      }
      return img
    })

    return () => {
      preloadedImages.forEach((img) => {
        img.onload = null
        img.onerror = null
      })
    }
  }, [])

  useEffect(() => {
    const updateTier = () => {
      const width = window.innerWidth
      const height = Math.max(window.innerHeight, 1)
      const aspectRatio = width / height
      const nextSmall = width < VIEWPORT_TIER.smallMaxWidth
      const nextWide = !nextSmall
        && width >= VIEWPORT_TIER.wideMinWidth
        && aspectRatio >= VIEWPORT_TIER.wideMinAspectRatio
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

    const resolveNodeCenter = (node) => {
      if (!node) return { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 }
      const rect = node.getBoundingClientRect()
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    }

    const updateCenters = () => {
      blobCentersRef.current = BLOB_LAYOUT.map((_, index) => resolveNodeCenter(blobRefs.current[index]))
      gridCentersRef.current = GRID_DECOR_LAYOUT.map((_, index) => resolveNodeCenter(gridRefs.current[index]))
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
    const applyLayerOffsets = (layout, refs, offsetsRef) => {
      layout.forEach((_, index) => {
        const node = refs.current[index]
        if (!node) return
        const { x, y } = offsetsRef.current[index]
        node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`
      })
    }

    const applyOffsets = () => {
      applyLayerOffsets(BLOB_LAYOUT, blobRefs, blobOffsetsRef)
      applyLayerOffsets(GRID_DECOR_LAYOUT, gridRefs, gridOffsetsRef)
    }

    const resetOffsets = () => {
      pointerRef.current.active = false
      smoothedPointerRef.current.ready = false
      blobOffsetsRef.current.forEach((offset) => {
        offset.x = 0
        offset.y = 0
        offset.vx = 0
        offset.vy = 0
      })
      gridOffsetsRef.current.forEach((offset) => {
        offset.x = 0
        offset.y = 0
        offset.vx = 0
        offset.vy = 0
      })
      applyOffsets()
    }

    if (prefersReducedMotion || isThemeSwitching || !interactive) {
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
      smoothedPointerRef.current.ready = false
    }

    const tick = () => {
      const pointer = pointerRef.current
      const smoothedPointer = smoothedPointerRef.current
      if (pointer.active) {
        if (!smoothedPointer.ready) {
          smoothedPointer.x = pointer.x
          smoothedPointer.y = pointer.y
          smoothedPointer.ready = true
        } else {
          smoothedPointer.x += (pointer.x - smoothedPointer.x) * POINTER_FOLLOW_EASING
          smoothedPointer.y += (pointer.y - smoothedPointer.y) * POINTER_FOLLOW_EASING
        }
      }

      const updateLayerMotion = (layout, centersRefValue, offsetsRefValue) => {
        layout.forEach((item, index) => {
          const current = offsetsRefValue.current[index]
          const center = centersRefValue.current[index]
          if (!current || !center) return
          const effectiveX = center.x + current.x
          const effectiveY = center.y + current.y

          let targetX = 0
          let targetY = 0

          if (pointer.active) {
            const dx = smoothedPointer.x - effectiveX
            const dy = smoothedPointer.y - effectiveY
            const distance = Math.hypot(dx, dy)

            if (distance > 0 && distance < item.radius) {
              const intensity = 1 - distance / item.radius
              const force = intensity * intensity * item.strength * FORCE_SCALE
              targetX = (-dx / distance) * force
              targetY = (-dy / distance) * force
            }
          }

          const velocityX = (current.vx || 0) + (targetX - current.x) * SPRING_STIFFNESS
          const velocityY = (current.vy || 0) + (targetY - current.y) * SPRING_STIFFNESS

          current.vx = velocityX * SPRING_DAMPING
          current.vy = velocityY * SPRING_DAMPING
          current.x += current.vx
          current.y += current.vy

          if (Math.abs(current.x) < 0.01) current.x = 0
          if (Math.abs(current.y) < 0.01) current.y = 0
          if (Math.abs(current.vx) < 0.01) current.vx = 0
          if (Math.abs(current.vy) < 0.01) current.vy = 0
        })
      }

      updateLayerMotion(BLOB_LAYOUT, blobCentersRef, blobOffsetsRef)
      updateLayerMotion(GRID_DECOR_LAYOUT, gridCentersRef, gridOffsetsRef)

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
  }, [prefersReducedMotion, isThemeSwitching, interactive])

  const resolvePlacement = (item) => {
    const anchor = viewportTier.small
      ? (item.anchorSmall || item.anchor)
      : (viewportTier.wide ? (item.anchorWide || item.anchor) : item.anchor)
    const size = viewportTier.small
      ? (item.size.small || item.size.base)
      : (viewportTier.wide ? (item.size.wide || item.size.base) : item.size.base)

    return { ...anchor, width: size.w, height: size.h }
  }

  const layerShift = viewportTier.small ? '-1.25vw' : '-2vw'
  const gridLayerShift = viewportTier.small ? '-0.45vw' : '-0.8vw'
  const gridItems = GRID_DECOR_LAYOUT.map((item, index) => ({ item, index }))
  const underBlobGridItems = gridItems.filter(({ item }) => item.underBlobLayer)
  const blobStackGridItems = gridItems.filter(({ item }) => item.blobStackLayer)
  const overlayGridItems = gridItems.filter(
    ({ item }) => !item.underBlobLayer && !item.blobStackLayer,
  )

  const themeFadeStyle = {
    transition: THEME_FADE_TRANSITION,
    willChange: 'opacity',
  }

  const ambientDarkLayerStyle = {
    background: `
      radial-gradient(1500px 980px at 50% 52%, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.78) 57%, rgba(0, 0, 0, 1) 100%),
      radial-gradient(980px 700px at 50% 90%, rgba(0, 0, 0, 0.16) 0%, rgba(0, 0, 0, 0) 76%)
    `,
  }
  const ambientLightLayerStyle = {
    background: `
      radial-gradient(1300px 800px at 50% 46%, rgba(255, 255, 255, 0.985) 0%, rgba(249, 252, 255, 0.93) 52%, rgba(239, 246, 255, 0.82) 100%),
      radial-gradient(670px 450px at 16% 14%, rgba(165, 242, 255, 0.56) 0%, rgba(165, 242, 255, 0) 74%),
      radial-gradient(700px 460px at 85% 18%, rgba(190, 202, 255, 0.5) 0%, rgba(190, 202, 255, 0) 72%),
      radial-gradient(780px 560px at 84% 86%, rgba(160, 236, 245, 0.44) 0%, rgba(160, 236, 245, 0) 75%),
      radial-gradient(730px 530px at 14% 86%, rgba(195, 206, 255, 0.42) 0%, rgba(195, 206, 255, 0) 74%)
    `,
  }
  const centerWashDarkStyle = {
    background:
      'radial-gradient(58vw 44vh at 50% 50%, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.08) 56%, rgba(0, 0, 0, 0) 80%)',
  }
  const centerWashLightStyle = {
    background:
      'radial-gradient(60vw 44vh at 50% 50%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.56) 56%, rgba(255, 255, 255, 0) 80%)',
  }
  const vignetteDarkStyle = {
    background:
      'radial-gradient(circle at center, rgba(0, 0, 0, 0) 42%, rgba(0, 0, 0, 0.74) 100%)',
  }
  const vignetteLightStyle = {
    background:
      'radial-gradient(circle at center, rgba(255, 255, 255, 0) 52%, rgba(203, 217, 244, 0.22) 100%)',
  }

  const renderGridItem = (item, index) => {
    const src = GRID_DECOR_SOURCES[item.srcIndex]
    const placement = resolvePlacement(item)
    const sx = (item.flipX ? -1 : 1) * item.scale
    const sy = (item.flipY ? -1 : 1) * item.scale

    return (
      <div
        key={item.key}
        ref={(node) => {
          gridRefs.current[index] = node
        }}
        className="absolute will-change-transform overflow-visible"
        style={{
          ...placement,
          zIndex: item.z,
          transform: 'translate3d(0px, 0px, 0px)',
        }}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain"
          style={{
            transform: `rotate(${item.rotate}deg) scale(${sx}, ${sy})`,
            transformOrigin: 'center center',
            opacity: isDark ? item.opacityDark : item.opacityLight,
            transition: THEME_FADE_TRANSITION,
            willChange: 'opacity',
            mixBlendMode: isDark ? 'screen' : 'multiply',
            filter: isDark
              ? 'brightness(1.05) saturate(0.9) drop-shadow(0 0 7px rgba(255, 255, 255, 0.14))'
              : 'brightness(0) saturate(0) drop-shadow(0 1px 2px rgba(72, 94, 128, 0.18))',
          }}
        />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: '#000000', opacity: isDark ? 1 : 0, ...themeFadeStyle }}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: '#f9fbff', opacity: isDark ? 0 : 1, ...themeFadeStyle }}
      />
      <div className="absolute inset-0" style={{ ...ambientDarkLayerStyle, opacity: isDark ? 1 : 0, ...themeFadeStyle }} />
      <div className="absolute inset-0" style={{ ...ambientLightLayerStyle, opacity: isDark ? 0 : 1, ...themeFadeStyle }} />
      <div className="absolute inset-0" style={{ ...centerWashDarkStyle, opacity: isDark ? 1 : 0, ...themeFadeStyle }} />
      <div className="absolute inset-0" style={{ ...centerWashLightStyle, opacity: isDark ? 0 : 1, ...themeFadeStyle }} />

      <div className="absolute inset-0" style={{ transform: `translate3d(${gridLayerShift}, 0, 0)` }}>
        {underBlobGridItems.map(({ item, index }) => renderGridItem(item, index))}
      </div>

      <div className="absolute inset-0" style={{ transform: `translate3d(${layerShift}, 0, 0)` }}>
        {BLOB_LAYOUT.map((blob, index) => {
          const darkSrc = BLOB_SOURCES.dark[blob.srcIndex]
          const lightSrc = BLOB_SOURCES.light[blob.srcIndex]
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
                  src={darkSrc}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-contain"
                  style={{
                    opacity: isDark ? 0.93 : 0,
                    transition: THEME_FADE_TRANSITION,
                    willChange: 'opacity',
                    mixBlendMode: 'normal',
                    filter:
                      `brightness(0.93) contrast(1.08) saturate(1.02) drop-shadow(0 7px 14px rgba(0,0,0,0.7)) drop-shadow(0 0 8px ${darkGlow.primary})`,
                  }}
                />
                <img
                  src={lightSrc}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-contain"
                  style={{
                    opacity: isDark ? 0 : 0.97,
                    transition: THEME_FADE_TRANSITION,
                    willChange: 'opacity',
                    mixBlendMode: 'normal',
                    filter:
                      `brightness(1.04) saturate(1.07) drop-shadow(0 5px 10px rgba(130, 154, 196, 0.22)) drop-shadow(0 0 10px ${lightGlow.primary})`,
                  }}
                />
              </div>
            </div>
          )
        })}
        {blobStackGridItems.map(({ item, index }) => renderGridItem(item, index))}
      </div>

      <div className="absolute inset-0" style={{ transform: `translate3d(${gridLayerShift}, 0, 0)` }}>
        {overlayGridItems.map(({ item, index }) => renderGridItem(item, index))}
      </div>

      <div className="absolute inset-0" style={{ ...vignetteDarkStyle, opacity: isDark ? 1 : 0, ...themeFadeStyle }} />
      <div className="absolute inset-0" style={{ ...vignetteLightStyle, opacity: isDark ? 0 : 1, ...themeFadeStyle }} />
    </div>
  )
}

export default AnimatedBackground
