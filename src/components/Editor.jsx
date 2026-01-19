import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { getGridConfig } from '../lib/layouts'
import Moveable from 'react-moveable'
import {
  ELEMENT_CATEGORIES,
  SCENE_CATEGORIES,
  PATTERN_CATEGORIES,
  getElementsByCategory,
  getScenesByCategory,
  getPatternsByCategory,
  getElementPath,
  getScenePath,
  getPatternPath,
} from '../lib/assetCategories'

// Layout spacing constants (increased ~12% for more background visibility)
const LAYOUT_PADDING_RATIO = 0.05  // was 0.03
const LAYOUT_GAP_RATIO = 0.025     // was 0.015

// ============================================
// CONSTANTS
// ============================================
const TABS = {
  BACKGROUND: 'background',
  ELEMENTS: 'elements',
}

const BG_TYPES = {
  SOLID: 'solid',
  SCENE: 'scene',
  PATTERN: 'pattern',
}

// Solid color options (18 curated colors, no PNG assets)
// Order: Neutrals → Pastels → Bold → Dark
// light: true means dark text needed for contrast
const SOLID_COLORS = [
  // Core neutrals
  { id: 'white', name: 'White', color: '#FFFFFF', light: true },
  { id: 'cream', name: 'Cream', color: '#FAFAF7', light: true },
  { id: 'light-gray', name: 'Light Gray', color: '#E6E6E6', light: true },
  { id: 'medium-gray', name: 'Med Gray', color: '#CFCFCF', light: true },
  { id: 'charcoal', name: 'Charcoal', color: '#1E1E1E', light: false },
  { id: 'black', name: 'Black', color: '#000000', light: false },
  // Soft pastels
  { id: 'blush-pink', name: 'Blush', color: '#F6C1CC', light: true },
  { id: 'lavender', name: 'Lavender', color: '#E6D9FF', light: true },
  { id: 'baby-blue', name: 'Baby Blue', color: '#DCEBFF', light: true },
  { id: 'mint', name: 'Mint', color: '#DFF3EA', light: true },
  { id: 'peach', name: 'Peach', color: '#FFE3D6', light: true },
  { id: 'butter-yellow', name: 'Butter', color: '#FFF3C4', light: true },
  // Bold / aesthetic
  { id: 'royal-blue', name: 'Royal', color: '#1E40FF', light: false },
  { id: 'emerald-green', name: 'Emerald', color: '#0F766E', light: false },
  { id: 'crimson-red', name: 'Crimson', color: '#E53935', light: false },
  { id: 'deep-purple', name: 'Purple', color: '#5B2D8B', light: false },
  // Dark tones
  { id: 'midnight-blue', name: 'Midnight', color: '#0F172A', light: false },
  { id: 'forest-green', name: 'Forest', color: '#1B4332', light: false },
]

// ============================================
// HELPER: Draw image with cover behavior
// ============================================
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

// ============================================
// HELPER: Round rect path
// ============================================
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ============================================
// HELPER: Load image as promise
// ============================================
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// ============================================
// BACKGROUND THUMBNAIL COMPONENT (Memoized)
// - Receives num + onSelect to avoid inline callback props
// ============================================
const BackgroundThumbnail = memo(function BackgroundThumbnail({ num, type, isSelected, onSelect }) {
  const [loaded, setLoaded] = useState(false)
  const ref = useRef(null)
  const [isInView, setIsInView] = useState(false)
  
  const fullSrc = type === BG_TYPES.SCENE ? getScenePath(num) : getPatternPath(num)
  const handleClick = useCallback(() => {
    onSelect({ type, num })
  }, [onSelect, type, num])
  
  // Intersection Observer for lazy loading
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.unobserve(element)
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    )
    
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  
  const selectedClass = isSelected
    ? 'ring-2 ring-[#B8001F] ring-offset-2 scale-[1.02]'
    : 'hover:scale-[1.03]'
  
  // Pattern: use div with tiled background (no cropped img)
  if (type === BG_TYPES.PATTERN) {
    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={`thumbnail-card relative aspect-square rounded-xl overflow-hidden transition-all duration-200 ${selectedClass}`}
        style={{
          backgroundImage: isInView ? `url(${fullSrc})` : 'none',
          backgroundRepeat: 'repeat',
          backgroundSize: '64px 64px',
          backgroundColor: 'var(--color-surface)',
          '--tw-ring-offset-color': 'var(--panel-bg)',
        }}
      />
    )
  }

  // Scene: use img with cover - only load when in view
  return (
    <button
      ref={ref}
      onClick={handleClick}
      className={`thumbnail-card relative aspect-square rounded-xl overflow-hidden transition-all duration-200 ${selectedClass}`}
      style={{ '--tw-ring-offset-color': 'var(--panel-bg)' }}
    >
      {(!loaded || !isInView) && <div className="absolute inset-0 bg-[var(--color-surface)] animate-pulse" />}
      {isInView && (
        <img
          src={fullSrc}
          alt=""
          className={`w-full h-full object-cover transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
      )}
    </button>
  )
})

// ============================================
// ELEMENT THUMBNAIL COMPONENT (Memoized, click-to-add)
// - Receives num + onAdd to avoid inline callback props
// ============================================
const ElementThumbnail = memo(function ElementThumbnail({ num, onAdd }) {
  const [loaded, setLoaded] = useState(false)
  const ref = useRef(null)
  const [isInView, setIsInView] = useState(false)
  
  const fullSrc = getElementPath(num)
  const handleClick = useCallback(() => {
    onAdd(fullSrc)
  }, [onAdd, fullSrc])
  
  // Intersection Observer for lazy loading
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.unobserve(element)
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    )
    
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <button
      ref={ref}
      onClick={handleClick}
      className="thumbnail-card relative aspect-square rounded-xl overflow-hidden cursor-pointer
                  transition-all duration-200 hover:scale-105 p-1.5"
    >
      {(!loaded || !isInView) && <div className="absolute inset-0 bg-[var(--color-surface)] animate-pulse rounded-lg" />}
      {isInView && (
        <img
          src={fullSrc}
          alt=""
          className={`w-full h-full object-contain transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          draggable={false}
          onLoad={() => setLoaded(true)}
        />
      )}
    </button>
  )
})

// ============================================
// PLACED ELEMENT COMPONENT (transform-only positioning for Moveable)
// - Uses transform for ALL positioning (no left/top mixing)
// - will-change + touch-action for smooth dragging
// - Includes delete X button when selected (hidden during export)
// ============================================
const PlacedElement = memo(function PlacedElement({ element, containerRect, isSelected, onSelect, onDelete, isExporting }) {
  const size = element.scale * 80
  
  // Calculate pixel position from percentage (transform-only approach)
  const getTransformStyle = () => {
    const width = containerRect?.width || 0
    const height = containerRect?.height || 0
    if (!width || !height) {
      return `translate(-50%, -50%) rotate(${element.rotation}deg)`
    }
    const px = (element.x / 100) * width
    const py = (element.y / 100) * height
    return `translate(${px - size/2}px, ${py - size/2}px) rotate(${element.rotation}deg)`
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete(element.id)
  }

  return (
    <div
      data-element-id={element.id}
      className={`placed-element absolute select-none ${isSelected && !isExporting ? 'z-50' : 'z-40'}`}
      style={{
        left: 0,
        top: 0,
        width: `${size}px`,
        height: `${size}px`,
        transform: getTransformStyle(),
        transformOrigin: 'center center',
        willChange: 'transform',
        touchAction: 'none',
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(element.id) }}
    >
      <img
        src={element.src}
        alt=""
        className="w-full h-full object-contain pointer-events-none"
        draggable={false}
      />
      {/* Delete X button - only when selected and not exporting */}
      {isSelected && !isExporting && (
        <button
          onClick={handleDelete}
          className="element-delete-btn"
          title="Delete element"
        >
          ×
        </button>
      )}
    </div>
  )
})

// ============================================
// MAIN EDITOR COMPONENT
// ============================================
function Editor({ photos, layout, orientation, onComplete, onReset }) {
  // ----------------------------------------
  // STATE
  // ----------------------------------------
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState(TABS.BACKGROUND)
  
  // Background state
  const [bgType, setBgType] = useState(BG_TYPES.SOLID)
  const [bgCategory, setBgCategory] = useState('all')
  const [selectedBg, setSelectedBg] = useState({ type: BG_TYPES.SOLID, color: '#ffffff' }) // { type, num } or { type, color }
  const [loadedBgUrl, setLoadedBgUrl] = useState(null) // URL of fully loaded background
  const [bgTransitioning, setBgTransitioning] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  // Elements state
  const [elementCategory, setElementCategory] = useState('all')
  const [placedElements, setPlacedElements] = useState([])
  const [selectedElementId, setSelectedElementId] = useState(null)
  const [containerRect, setContainerRect] = useState({ width: 0, height: 0 })
  const [canvasEl, setCanvasEl] = useState(null)
  
  // Bottom sheet state for mobile
  const [sheetSnapIndex, setSheetSnapIndex] = useState(1) // 0=collapsed, 1=half, 2=expanded
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragStartHeight, setDragStartHeight] = useState(0)
  const sheetRef = useRef(null)
  
  // Refs
  const canvasContainerRef = useRef(null)
  const canvasWrapperRef = useRef(null)
  const exportCanvasRef = useRef(null)
  
  // Loaded images cache
  const [loadedPhotos, setLoadedPhotos] = useState([])

  // ----------------------------------------
  // RESPONSIVE STATE
  // ----------------------------------------
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800)
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      setWindowHeight(window.innerHeight)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // ----------------------------------------
  // DERIVED VALUES
  // ----------------------------------------
  const gridConfig = getGridConfig(layout, orientation)
  const { rows, cols } = gridConfig
  
  const isVertical = orientation?.id === 'vertical'
  const canvasAspect = orientation ? (orientation.width / orientation.height) : (16/9)
  
  // Panel grid: ALWAYS 3 columns for all layouts
  const panelGridCols = 3
  const panelVisibleRows = isVertical ? 4 : 3
  
  // Base dimensions at 100% scale (what we designed for full screen)
  const BASE_PANEL_HEADER = 120
  const BASE_PANEL_FOOTER = 85
  const BASE_TILE_SIZE = 72
  const BASE_GRID_GAP = 6
  const BASE_PANEL_WIDTH = 290
  const BASE_GAP = 24 // gap between canvas and panel
  
  const basePanelGridHeight = (panelVisibleRows * BASE_TILE_SIZE) + ((panelVisibleRows - 1) * BASE_GRID_GAP)
  const basePanelHeight = BASE_PANEL_HEADER + basePanelGridHeight + BASE_PANEL_FOOTER
  const baseCanvasHeight = basePanelHeight
  const baseCanvasWidth = Math.round(baseCanvasHeight * canvasAspect)
  
  // Total base width needed for side-by-side layout
  const baseTotalWidth = baseCanvasWidth + BASE_GAP + BASE_PANEL_WIDTH
  
  // Calculate scale factor based on available viewport
  // Account for padding (32px on each side = 64px total)
  const availableWidth = windowWidth - 64
  const availableHeight = windowHeight - 150 // account for header and padding
  
  // Determine if we should stack (mobile) or side-by-side
  // Stack when viewport is too narrow OR when scale would be too small
  const minUsableScale = 0.55
  const wouldNeedScale = availableWidth / baseTotalWidth
  const isMobile = wouldNeedScale < minUsableScale || windowWidth < 700
  
  // Calculate final dimensions
  let finalCanvasWidth, finalCanvasHeight, finalPanelWidth, finalPanelHeight, finalScale
  
  if (isMobile) {
    // MOBILE: Canvas size CHANGES based on sheet position
    // When sheet is collapsed (index 0): canvas gets BIGGER
    // When sheet is half (index 1): canvas is medium
    // When sheet is expanded (index 2): canvas is smaller
    // This will be calculated dynamically in render based on sheetSnapIndex
    
    // Default values (will be overridden in render)
    finalCanvasWidth = Math.min(availableWidth - 16, 380)
    finalCanvasHeight = Math.round(finalCanvasWidth / canvasAspect)
    
    // Panel dimensions
    finalPanelWidth = Math.min(480, Math.max(280, windowWidth * 0.75))
    finalPanelHeight = windowHeight * 0.5
    finalScale = 1
  } else {
    // DESKTOP: Side-by-side layout - scale both proportionally
    // Calculate how much we need to scale down to fit
    const widthScale = availableWidth / baseTotalWidth
    const heightScale = availableHeight / basePanelHeight
    
    // Use the smaller scale, but cap between 0.6 and 1.0
    finalScale = Math.min(1, Math.max(0.6, Math.min(widthScale, heightScale)))
    
    // Apply scale to all dimensions
    finalPanelHeight = Math.round(basePanelHeight * finalScale)
    finalPanelWidth = Math.round(BASE_PANEL_WIDTH * finalScale)
    finalCanvasHeight = finalPanelHeight // ALWAYS match panel height
    finalCanvasWidth = Math.round(finalCanvasHeight * canvasAspect)
  }
  
  // These are used in the render
  const panelTotalHeight = finalPanelHeight
  const panelWidth = finalPanelWidth
  const canvasWidth = finalCanvasWidth
  const canvasHeight = finalCanvasHeight

  // Get all backgrounds for current category (no pagination - scroll only)
  const availableBackgrounds = bgType === BG_TYPES.SCENE
    ? getScenesByCategory(bgCategory)
    : bgType === BG_TYPES.PATTERN
      ? getPatternsByCategory(bgCategory)
      : []

  // Get all elements for current category (no pagination - scroll only)
  const availableElements = getElementsByCategory(elementCategory)

  // Get category options
  const bgCategories = bgType === BG_TYPES.SCENE
    ? { all: { name: 'All' }, ...SCENE_CATEGORIES }
    : bgType === BG_TYPES.PATTERN
      ? { all: { name: 'All' }, ...PATTERN_CATEGORIES }
      : {}

  const elementCategories = { all: { name: 'All' }, ...ELEMENT_CATEGORIES }

  // ----------------------------------------
  // EFFECTS
  // ----------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Preload photos
  useEffect(() => {
    if (!photos?.length) return
    
    Promise.all(photos.map(src => loadImage(src)))
      .then(setLoadedPhotos)
      .catch(console.error)
  }, [photos])



  // ----------------------------------------
  // BACKGROUND PRELOAD HANDLER
  // ----------------------------------------
  const handleSelectBg = useCallback((newBg) => {
    if (!newBg) {
      setSelectedBg(null)
      setLoadedBgUrl(null)
      return
    }
    
    // Solid colors don't need preloading
    if (newBg.type === BG_TYPES.SOLID) {
      setBgTransitioning(true)
      setSelectedBg(newBg)
      setLoadedBgUrl(null)
      setTimeout(() => setBgTransitioning(false), 200)
      return
    }
    
    const bgPath = newBg.type === BG_TYPES.SCENE
      ? getScenePath(newBg.num)
      : getPatternPath(newBg.num)
    
    // Preload image before committing
    const img = new Image()
    img.onload = () => {
      setBgTransitioning(true)
      setSelectedBg(newBg)
      setLoadedBgUrl(bgPath)
      // End transition after crossfade
      setTimeout(() => setBgTransitioning(false), 200)
    }
    img.src = bgPath
  }, [])

  // ----------------------------------------
  // ELEMENT HANDLERS
  // ----------------------------------------
  // Click-to-add element centered
  const addElementCentered = useCallback((src) => {
    const newElement = {
      id: Date.now() + Math.random(),
      src,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
    }
    setPlacedElements(prev => [...prev, newElement])
    setSelectedElementId(newElement.id)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const src = e.dataTransfer.getData('text/plain')
    if (!src || !canvasContainerRef.current) return

    const rect = canvasContainerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newElement = {
      id: Date.now() + Math.random(),
      src,
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
      scale: 1,
      rotation: 0,
    }

    setPlacedElements(prev => [...prev, newElement])
    setSelectedElementId(newElement.id)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const updateElement = useCallback((id, updates) => {
    setPlacedElements(prev =>
      prev.map(el => (el.id === id ? { ...el, ...updates } : el))
    )
  }, [])

  const deleteElement = useCallback((id) => {
    setPlacedElements(prev => prev.filter(el => el.id !== id))
    setSelectedElementId(null)
  }, [])

  const deselectAll = useCallback(() => {
    setSelectedElementId(null)
  }, [])


  // ----------------------------------------
  // BACKGROUND STYLE FOR PREVIEW (crossfade layer)
  // ----------------------------------------
  const getBackgroundStyle = () => {
    // Solid color backgrounds
    if (selectedBg?.type === BG_TYPES.SOLID) {
      return { backgroundColor: selectedBg.color }
    }
    
    if (!loadedBgUrl) {
      return { backgroundColor: '#ffffff' }
    }

    if (selectedBg?.type === BG_TYPES.SCENE) {
      return {
        backgroundImage: `url(${loadedBgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    } else {
      return {
        backgroundImage: `url(${loadedBgUrl})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '240px 240px', // Pattern tile size
      }
    }
  }

  // ----------------------------------------
  // PHOTO GRID LAYOUT CALCULATION (uses spacing constants)
  // ----------------------------------------
  const getPhotoGridStyle = () => {
    // ~5% padding, ~2.5% gap for more background visibility
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: '2.5%',
      padding: '5%',
      height: '100%',
    }
  }

  // ----------------------------------------
  // EXPORT FUNCTION - Pixel-identical to preview
  // ----------------------------------------
  const handleExport = async () => {
    if (!exportCanvasRef.current || !loadedPhotos.length) return

    // Hide selection UI during export
    setIsExporting(true)
    setSelectedElementId(null)
    
    // Wait for UI to settle
    await new Promise(r => setTimeout(r, 50))

    const canvas = exportCanvasRef.current
    const ctx = canvas.getContext('2d')

    const canvasWidth = orientation.width
    const canvasHeight = orientation.height

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // LAYER 1: Background
    if (selectedBg?.type === BG_TYPES.SOLID) {
      // Solid color background
      ctx.fillStyle = selectedBg.color
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    } else if (selectedBg && loadedBgUrl) {
      try {
        const bgImg = await loadImage(loadedBgUrl)

        if (selectedBg.type === BG_TYPES.SCENE) {
          // Scene: cover behavior
          drawImageCover(ctx, bgImg, 0, 0, canvasWidth, canvasHeight)
        } else {
          // Pattern: repeat/tile at 240px (matching preview)
          const pattern = ctx.createPattern(bgImg, 'repeat')
          ctx.save()
          // Scale pattern to match 240px preview tile size
          const scaleFactor = 240 / bgImg.width * (canvasWidth / 400) // Adjust for canvas size
          ctx.scale(scaleFactor, scaleFactor)
          ctx.fillStyle = pattern
          ctx.fillRect(0, 0, canvasWidth / scaleFactor, canvasHeight / scaleFactor)
          ctx.restore()
        }
      } catch (err) {
        console.error('Failed to load background:', err)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      }
    } else {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    }

    // LAYER 2: Photos (use spacing constants for pixel-match)
    const padding = Math.min(canvasWidth, canvasHeight) * LAYOUT_PADDING_RATIO
    const gap = Math.min(canvasWidth, canvasHeight) * LAYOUT_GAP_RATIO

    const availableWidth = canvasWidth - (padding * 2) - (gap * (cols - 1))
    const availableHeight = canvasHeight - (padding * 2) - (gap * (rows - 1))

    const photoWidth = availableWidth / cols
    const photoHeight = availableHeight / rows
    const cornerRadius = Math.min(photoWidth, photoHeight) * 0.02

    loadedPhotos.forEach((img, index) => {
      if (!img || index >= layout.shots) return

      const col = index % cols
      const row = Math.floor(index / cols)

      const x = padding + (col * (photoWidth + gap))
      const y = padding + (row * (photoHeight + gap))

      // Shadow
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
      ctx.shadowBlur = 12
      ctx.shadowOffsetY = 4
      ctx.fillStyle = '#ffffff'
      roundRect(ctx, x, y, photoWidth, photoHeight, cornerRadius)
      ctx.fill()
      ctx.restore()

      // Photo with rounded corners
      ctx.save()
      roundRect(ctx, x, y, photoWidth, photoHeight, cornerRadius)
      ctx.clip()
      drawImageCover(ctx, img, x, y, photoWidth, photoHeight)
      ctx.restore()
    })

    // LAYER 3: Elements (clipped to frame)
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, canvasWidth, canvasHeight)
    ctx.clip()
    
    for (const element of placedElements) {
      try {
        const elImg = await loadImage(element.src)
        
        const x = (element.x / 100) * canvasWidth
        const y = (element.y / 100) * canvasHeight
        
        // Match preview element size
        const baseSize = Math.min(canvasWidth, canvasHeight) * 0.08
        const size = baseSize * element.scale

        ctx.save()
        ctx.translate(x, y)
        ctx.rotate((element.rotation * Math.PI) / 180)
        ctx.drawImage(elImg, -size / 2, -size / 2, size, size)
        ctx.restore()
      } catch (err) {
        console.error('Failed to load element:', err)
      }
    }
    ctx.restore()

    // Download
    const link = document.createElement('a')
    link.download = `snap-photo-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

    setIsExporting(false)
    onComplete?.(canvas.toDataURL('image/png'))
  }

  // ----------------------------------------
  // RENDER
  // ----------------------------------------
  
  // Panel content - shared between side panel and bottom sheet
  const renderPanelContent = (isBottomSheet = false) => (
    <>
      {/* === FIXED HEADER AREA === */}
      <div className="space-y-2" style={{ padding: isBottomSheet ? '12px 16px 6px 16px' : '12px 10px 6px 10px' }}>
        {/* Main Tabs - Background / Elements */}
        <div className="flex gap-1.5 p-1.5 pt-[7px] rounded-xl" style={{ background: 'var(--toggle-bg)' }}>
          <button
            onClick={() => setActiveTab(TABS.BACKGROUND)}
            className={`flex-1 h-8 rounded-lg text-xs font-semibold transition-all ${
              activeTab === TABS.BACKGROUND
                ? 'text-[#B8001F] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
            style={activeTab === TABS.BACKGROUND ? { background: 'var(--toggle-active-bg)' } : {}}
          >
            Background
          </button>
          <button
            onClick={() => setActiveTab(TABS.ELEMENTS)}
            className={`flex-1 h-8 rounded-lg text-xs font-semibold transition-all ${
              activeTab === TABS.ELEMENTS
                ? 'text-[#B8001F] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
            style={activeTab === TABS.ELEMENTS ? { background: 'var(--toggle-active-bg)' } : {}}
          >
            Elements
          </button>
        </div>

        {/* Divider after Level 1 */}
        <div className="border-t border-[var(--card-border)]" style={{ marginTop: '2px', marginBottom: '2px' }} />

        {/* Level 2: Background sub-toggles */}
        {activeTab === TABS.BACKGROUND && (
          <div className="flex gap-1.5">
            <button
              onClick={() => { setBgType(BG_TYPES.SOLID); setBgCategory('all') }}
              className={`flex-1 h-7 rounded-md text-[11px] font-medium transition-all ${
                bgType === BG_TYPES.SOLID
                  ? 'bg-[#B8001F]/10 text-[#B8001F]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
              style={bgType !== BG_TYPES.SOLID ? { background: 'var(--toggle-bg)' } : {}}
            >
              Solid
            </button>
            <button
              onClick={() => { setBgType(BG_TYPES.SCENE); setBgCategory('all') }}
              className={`flex-1 h-7 rounded-md text-[11px] font-medium transition-all ${
                bgType === BG_TYPES.SCENE
                  ? 'bg-[#B8001F]/10 text-[#B8001F]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
              style={bgType !== BG_TYPES.SCENE ? { background: 'var(--toggle-bg)' } : {}}
            >
              Scenes
            </button>
            <button
              onClick={() => { setBgType(BG_TYPES.PATTERN); setBgCategory('all') }}
              className={`flex-1 h-7 rounded-md text-[11px] font-medium transition-all ${
                bgType === BG_TYPES.PATTERN
                  ? 'bg-[#B8001F]/10 text-[#B8001F]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
              style={bgType !== BG_TYPES.PATTERN ? { background: 'var(--toggle-bg)' } : {}}
            >
              Patterns
            </button>
          </div>
        )}

        {/* Level 2: Elements helper text */}
        {activeTab === TABS.ELEMENTS && (
          <p className="text-[9px] text-[var(--color-text-muted)]">
            Click to add elements to your photo
          </p>
        )}

        {/* Divider after Level 2 */}
        <div className="border-t border-[var(--card-border)]" style={{ marginTop: '2px', marginBottom: '2px' }} />

        {/* Level 3: Category chips */}
        <div 
          className="flex gap-1.5 overflow-x-auto py-1 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {activeTab === TABS.BACKGROUND && bgType !== BG_TYPES.SOLID && Object.entries(bgCategories).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setBgCategory(key)}
              className={`rounded-full text-[8px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                bgCategory === key
                  ? 'bg-[#B8001F]/10 text-[#B8001F]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
              style={{ 
                padding: '2px 7px',
                ...(bgCategory !== key ? { background: 'var(--toggle-bg)' } : {})
              }}
            >
              {cat.name}
            </button>
          ))}
          {activeTab === TABS.ELEMENTS && Object.entries(elementCategories).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setElementCategory(key)}
              className={`rounded-full text-[8px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                elementCategory === key
                  ? 'bg-[#B8001F]/10 text-[#B8001F]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
              style={{ 
                padding: '2px 7px',
                ...(elementCategory !== key ? { background: 'var(--toggle-bg)' } : {})
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* === SCROLLABLE CONTENT AREA === */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-2" 
        style={{ paddingLeft: isBottomSheet ? '16px' : '10px', paddingRight: isBottomSheet ? '16px' : '10px' }}
      >
        {/* Background grids */}
        {activeTab === TABS.BACKGROUND && bgType === BG_TYPES.SOLID && (
          <div 
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${isBottomSheet ? 3 : panelGridCols}, minmax(0, 1fr))` }}
          >
            {SOLID_COLORS.map((solid) => (
              <button
                key={solid.id}
                onClick={() => handleSelectBg({ type: BG_TYPES.SOLID, color: solid.color })}
                className={`thumbnail-card relative aspect-square rounded-xl overflow-hidden transition-all duration-200 
                            flex items-center justify-center ${
                  selectedBg?.type === BG_TYPES.SOLID && selectedBg?.color === solid.color
                    ? 'ring-2 ring-[#B8001F] ring-offset-2 scale-[1.02]'
                    : 'hover:scale-[1.03]'
                }`}
                style={{
                  backgroundColor: solid.color,
                  borderColor: solid.light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                  '--tw-ring-offset-color': 'var(--panel-bg)',
                }}
              >
                <span
                  className="text-[11px] font-medium"
                  style={{ color: solid.light ? '#333' : '#fff' }}
                >
                  {solid.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {activeTab === TABS.BACKGROUND && bgType !== BG_TYPES.SOLID && (
          <div 
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${isBottomSheet ? 3 : panelGridCols}, minmax(0, 1fr))` }}
          >
            {availableBackgrounds.map((num) => (
              <BackgroundThumbnail
                key={`${bgType}-${num}`}
                num={num}
                type={bgType}
                isSelected={selectedBg?.type === bgType && selectedBg?.num === num}
                onSelect={handleSelectBg}
              />
            ))}
          </div>
        )}

        {/* Elements grid */}
        {activeTab === TABS.ELEMENTS && (
          <div 
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${isBottomSheet ? 3 : panelGridCols}, minmax(0, 1fr))` }}
          >
            {availableElements.map((num) => (
              <ElementThumbnail
                key={num}
                num={num}
                onAdd={addElementCentered}
              />
            ))}
          </div>
        )}
      </div>

      {/* === FIXED BOTTOM ACTIONS === */}
      <div style={{ padding: isBottomSheet ? '8px 16px 16px 16px' : '10px 10px 14px 10px' }}>
        <button
          onClick={handleExport}
          disabled={!loadedPhotos.length}
          className="w-full py-3 btn-primary text-white font-bold text-base 
                     shadow-lg hover:shadow-xl hover:shadow-[#B8001F]/20 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderRadius: '8px' }}
        >
          Download
        </button>
        <button
          onClick={onReset}
          className="w-full py-2 text-sm
                     text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] 
                     transition-all font-semibold"
          style={{ background: 'transparent', marginTop: '8px' }}
        >
          Start Over
        </button>
      </div>
    </>
  )
  
  // Mobile: Bottom sheet snap points (in vh)
  // For vertical layouts: lower default so canvas is more visible
  // For horizontal layouts: higher default
  // Collapsed (index 0): just shows grab handle + tabs (Background/Elements)
  const snapPoints = isVertical 
    ? [8, 50, 88] // collapsed (tabs only), half, expanded
    : [8, 58, 88] // collapsed (tabs only), half, expanded
  
  const currentSnapHeight = snapPoints[sheetSnapIndex]
  
  // Handle drag start
  const handleDragStart = (e) => {
    e.preventDefault()
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    setIsDragging(true)
    setDragStartY(clientY)
    setDragStartHeight(currentSnapHeight)
  }
  
  // Handle drag move
  const handleDragMove = (e) => {
    if (!isDragging) return
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const deltaY = dragStartY - clientY
    const deltaVh = (deltaY / windowHeight) * 100
    const newHeight = Math.max(snapPoints[0], Math.min(snapPoints[2], dragStartHeight + deltaVh))
    
    if (sheetRef.current) {
      sheetRef.current.style.height = `${newHeight}vh`
    }
  }
  
  // Handle drag end - snap to nearest point
  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    
    if (sheetRef.current) {
      const currentHeight = parseFloat(sheetRef.current.style.height)
      // Find nearest snap point
      let nearestIndex = 0
      let minDistance = Math.abs(currentHeight - snapPoints[0])
      snapPoints.forEach((point, index) => {
        const distance = Math.abs(currentHeight - point)
        if (distance < minDistance) {
          minDistance = distance
          nearestIndex = index
        }
      })
      setSheetSnapIndex(nearestIndex)
      sheetRef.current.style.height = `${snapPoints[nearestIndex]}vh`
    }
  }
  
  // Handle tap on grab handle - toggle between collapsed and half
  const handleGrabTap = () => {
    if (isDragging) return
    setSheetSnapIndex(prev => prev === 0 ? 1 : 0)
  }
  
  // Calculate dynamic canvas size based on sheet position
  // Sheet collapsed = bigger canvas, Sheet half = medium canvas
  // Sheet expanded (max) = canvas stays at "half" size and sits BEHIND the sheet
  const getCanvasSizeForSheet = () => {
    if (!isMobile) return { width: canvasWidth, height: canvasHeight }
    
    // For max expansion (index 2), use the "half" snap point so canvas doesn't shrink
    // This allows the canvas to sit behind the sheet at max expansion
    const effectiveSnapIndex = sheetSnapIndex === 2 ? 1 : sheetSnapIndex
    const sheetHeightVh = snapPoints[effectiveSnapIndex]
    
    // Calculate available height:
    // 100vh - sheet height - header (~50px) - margin top (10px) - margin bottom (10px)
    const headerAndMarginsVh = (isVertical ? 70 : 85) / windowHeight * 100 // header + top padding + margins
    const availableCanvasVh = 100 - sheetHeightVh - headerAndMarginsVh
    const maxHeight = (windowHeight * availableCanvasVh) / 100
    
    // Start with width constraint
    let w = Math.min(windowWidth - 32, 420)
    let h = Math.round(w / canvasAspect)
    
    // If too tall, constrain by available height
    if (h > maxHeight) {
      h = maxHeight
      w = Math.round(h * canvasAspect)
    }
    
    return { width: w, height: h }
  }
  
  const dynamicCanvasSize = getCanvasSizeForSheet()

  useEffect(() => {
    const updateRect = () => {
      const el = canvasContainerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setContainerRect({ width: rect.width, height: rect.height })
      setCanvasEl(el)
    }

    updateRect()
    window.addEventListener('resize', updateRect)
    return () => window.removeEventListener('resize', updateRect)
  }, [dynamicCanvasSize.width, dynamicCanvasSize.height, canvasWidth, canvasHeight, isMobile, sheetSnapIndex])
  
  // Mobile: Bottom sheet layout
  if (isMobile) {
    return (
      <div 
        className="h-screen w-screen overflow-hidden relative"
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        {/* Full screen canvas area */}
        <div 
          className="absolute inset-0 flex flex-col items-center px-4 pb-4"
          style={{ paddingTop: isVertical ? '10px' : '27px' }}
        >
          {/* Header */}
          <div 
            className={`text-center flex-shrink-0 ${isLoaded ? 'fade-up' : 'opacity-0'}`}
            style={{ marginBottom: isVertical ? '10px' : '12px' }}
          >
            <h2 className="text-lg font-bold">Customize</h2>
            <p className="text-[10px] font-bold text-[var(--color-text-muted)]">
              {layout?.name} • {orientation?.name}
            </p>
          </div>
          
          {/* Canvas - size CHANGES based on sheet position */}
          <div 
            ref={canvasWrapperRef}
            className={`flex-shrink-0 ${isLoaded ? 'scale-in' : 'opacity-0'}`}
            style={{
              width: `${dynamicCanvasSize.width}px`,
              height: `${dynamicCanvasSize.height}px`,
              maxWidth: 'calc(100% - 16px)',
              marginBottom: '10px', // breathing room between canvas and bottom sheet
              transition: 'width 0.3s ease-out, height 0.3s ease-out',
            }}
          >
            <div
              ref={canvasContainerRef}
              className="relative glass rounded-2xl overflow-hidden w-full h-full"
              onClick={deselectAll}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {/* Background Layer */}
              <div
                className="absolute inset-0 transition-opacity duration-200"
                style={{
                  ...getBackgroundStyle(),
                  opacity: bgTransitioning ? 0.7 : 1,
                }}
              />

              {/* Photo Grid */}
              <div className="relative z-10" style={getPhotoGridStyle()}>
                {photos.slice(0, layout?.shots || 4).map((photo, index) => (
                  <div
                    key={index}
                    className="relative overflow-hidden rounded-lg shadow-md bg-white"
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>

              {/* Placed Elements */}
              <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
                <div className="relative w-full h-full pointer-events-auto">
                  {placedElements.map(element => (
                    <PlacedElement
                      key={element.id}
                      element={element}
                      containerRect={containerRect}
                      isSelected={element.id === selectedElementId}
                      onSelect={setSelectedElementId}
                      onDelete={deleteElement}
                      isExporting={isExporting}
                    />
                  ))}
                </div>
              </div>

              {/* Moveable */}
              {selectedElementId && !isExporting && (
                <Moveable
                  target={`.placed-element[data-element-id="${selectedElementId}"]`}
                  container={canvasEl}
                  draggable={true}
                  rotatable={true}
                  resizable={true}
                  keepRatio={true}
                  throttleDrag={0}
                  throttleRotate={0}
                  throttleResize={0}
                  renderDirections={["nw", "ne", "sw", "se"]}
                  rotationPosition="top"
                  origin={false}
                  padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
                  onDrag={({ target, transform }) => {
                    target.style.transform = transform
                  }}
                  onDragEnd={({ target }) => {
                    const container = canvasContainerRef.current
                    if (!container) return
                    const containerRect = container.getBoundingClientRect()
                    const elRect = target.getBoundingClientRect()
                    const centerX = elRect.left - containerRect.left + elRect.width / 2
                    const centerY = elRect.top - containerRect.top + elRect.height / 2
                    updateElement(selectedElementId, {
                      x: Math.max(0, Math.min(100, (centerX / containerRect.width) * 100)),
                      y: Math.max(0, Math.min(100, (centerY / containerRect.height) * 100)),
                    })
                  }}
                  onRotate={({ target, transform }) => {
                    target.style.transform = transform
                  }}
                  onRotateEnd={({ lastEvent }) => {
                    if (!lastEvent) return
                    updateElement(selectedElementId, { rotation: lastEvent.rotate })
                  }}
                  onResize={({ target, width, height, drag }) => {
                    target.style.width = `${width}px`
                    target.style.height = `${height}px`
                    target.style.transform = drag.transform
                  }}
                  onResizeEnd={({ target, lastEvent }) => {
                    if (!lastEvent) return
                    const container = canvasContainerRef.current
                    if (!container) return
                    const containerRect = container.getBoundingClientRect()
                    const elRect = target.getBoundingClientRect()
                    const centerX = elRect.left - containerRect.left + elRect.width / 2
                    const centerY = elRect.top - containerRect.top + elRect.height / 2
                    const newWidth = parseFloat(target.style.width)
                    const newScale = newWidth / 80
                    updateElement(selectedElementId, { 
                      scale: Math.max(0.3, Math.min(3, newScale)),
                      x: Math.max(0, Math.min(100, (centerX / containerRect.width) * 100)),
                      y: Math.max(0, Math.min(100, (centerY / containerRect.height) * 100)),
                    })
                  }}
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Bottom Sheet Container - centers the sheet */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none">
          <div 
            ref={sheetRef}
            className={`sidebar-panel rounded-t-3xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto ${isLoaded ? 'fade-up delay-200' : 'opacity-0'}`}
            style={{ 
              width: '75%',
              maxWidth: '480px',
              minWidth: '280px',
              height: `${currentSnapHeight}vh`,
              transition: isDragging ? 'none' : 'height 0.3s ease-out',
            }}
          >
            {/* Drag handle - supports drag and tap */}
            <div 
              className="flex justify-center pt-8 pb-3 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
              onClick={handleGrabTap}
            >
              <div className="w-12 h-1.5 bg-[var(--color-text-muted)] rounded-full opacity-50" />
            </div>
            
            {renderPanelContent(true)}
          </div>
        </div>
        
        {/* Hidden Export Canvas */}
        <canvas ref={exportCanvasRef} className="hidden" />
      </div>
    )
  }
  
  // Desktop: Side-by-side layout
  return (
    <div 
      className="min-h-screen flex flex-col items-center px-4 md:px-6"
      style={{ 
        paddingTop: '17px', 
        paddingBottom: '32px',
        justifyContent: 'center',
      }}
    >
      {/* Shared Header - centered above both canvas and sidebar */}
      <div className={`text-center ${isLoaded ? 'fade-up' : 'opacity-0'}`} style={{ marginBottom: '25px' }}>
        <h2 className="text-2xl md:text-3xl font-bold">Customize</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {layout?.name} • {orientation?.name}
        </p>
      </div>

      {/* Main Content - Canvas + Sidebar */}
      <div 
        className="flex items-start justify-center flex-row"
        style={{ gap: `${Math.round(24 * finalScale)}px` }}
      >
        {/* Canvas Column - height ALWAYS matches panel */}
        <div 
          ref={canvasWrapperRef}
          className={`flex-shrink-0 ${isLoaded ? 'scale-in' : 'opacity-0'}`}
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
          }}
        >
          {/* Canvas Container - fills the calculated dimensions */}
          <div
            ref={canvasContainerRef}
            className="relative glass rounded-2xl overflow-hidden w-full h-full"
            onClick={deselectAll}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {/* Background Layer - crossfade transition */}
            <div
              className="absolute inset-0 transition-opacity duration-200"
              style={{
                ...getBackgroundStyle(),
                opacity: bgTransitioning ? 0.7 : 1,
              }}
            />

            {/* Photo Grid - LAYER 2 (stable, doesn't remount on bg change) */}
            <div className="relative z-10" style={getPhotoGridStyle()}>
              {photos.slice(0, layout?.shots || 4).map((photo, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-lg shadow-md bg-white"
                >
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
              ))}
            </div>

            {/* Placed Elements - LAYER 3 (clipped to frame) */}
            <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
              <div className="relative w-full h-full pointer-events-auto">
                {placedElements.map(element => (
                  <PlacedElement
                    key={element.id}
                    element={element}
                    containerRect={containerRect}
                    isSelected={element.id === selectedElementId}
                    onSelect={setSelectedElementId}
                    onDelete={deleteElement}
                    isExporting={isExporting}
                  />
                ))}
              </div>
            </div>

            {/* Moveable for selected element - transform-only, single source of truth */}
              {selectedElementId && !isExporting && (
                <Moveable
                  target={`.placed-element[data-element-id="${selectedElementId}"]`}
                  container={canvasEl}
                  draggable={true}
                  rotatable={true}
                  resizable={true}
                  keepRatio={true}
                throttleDrag={0}
                throttleRotate={0}
                throttleResize={0}
                renderDirections={['nw', 'ne', 'sw', 'se']}
                rotationPosition="top"
                origin={false}
                // DRAG: Direct DOM transform update only
                onDrag={({ target, transform }) => {
                  target.style.transform = transform
                }}
                onDragEnd={({ target, lastEvent }) => {
                  if (!lastEvent) return
                  const container = canvasContainerRef.current
                  if (!container) return
                  const containerRect = container.getBoundingClientRect()
                  const elRect = target.getBoundingClientRect()
                  const centerX = elRect.left - containerRect.left + elRect.width / 2
                  const centerY = elRect.top - containerRect.top + elRect.height / 2
                  updateElement(selectedElementId, {
                    x: Math.max(0, Math.min(100, (centerX / containerRect.width) * 100)),
                    y: Math.max(0, Math.min(100, (centerY / containerRect.height) * 100)),
                  })
                }}
                // ROTATE: Direct DOM transform update only
                onRotate={({ target, transform }) => {
                  target.style.transform = transform
                }}
                onRotateEnd={({ lastEvent }) => {
                  if (!lastEvent) return
                  updateElement(selectedElementId, { rotation: lastEvent.rotate })
                }}
                // RESIZE: Direct DOM update during resize
                onResize={({ target, width, height, drag }) => {
                  target.style.width = `${width}px`
                  target.style.height = `${height}px`
                  target.style.transform = drag.transform
                }}
                onResizeEnd={({ target, lastEvent }) => {
                  if (!lastEvent) return
                  const container = canvasContainerRef.current
                  if (!container) return
                  const containerRect = container.getBoundingClientRect()
                  const elRect = target.getBoundingClientRect()
                  const centerX = elRect.left - containerRect.left + elRect.width / 2
                  const centerY = elRect.top - containerRect.top + elRect.height / 2
                  const newWidth = parseFloat(target.style.width)
                  const newScale = newWidth / 80
                  updateElement(selectedElementId, { 
                    scale: Math.max(0.3, Math.min(3, newScale)),
                    x: Math.max(0, Math.min(100, (centerX / containerRect.width) * 100)),
                    y: Math.max(0, Math.min(100, (centerY / containerRect.height) * 100)),
                  })
                }}
              />
            )}
          </div>
        </div>

        {/* Tools Panel - Height ALWAYS matches canvas on desktop */}
        <div 
          className={`flex flex-col ${isLoaded ? 'fade-up delay-200' : 'opacity-0'}`}
          style={{ 
            width: `${panelWidth}px`,
            height: `${panelTotalHeight}px`,
            flexShrink: 0,
          }}
        >
          {/* Sidebar Panel - uses CSS variables for theme */}
          <div className="sidebar-panel rounded-2xl shadow-lg flex flex-col h-full overflow-hidden">
            {renderPanelContent(false)}
          </div>
        </div>
      </div>

      {/* Hidden Export Canvas */}
      <canvas ref={exportCanvasRef} className="hidden" />
    </div>
  )
}

export default Editor
