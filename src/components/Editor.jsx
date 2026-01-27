import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import FrameEditPanel from './FrameEditPanel'
import { getGridConfig } from '../lib/layouts'
import { getSpacingRatios } from '../lib/spacing'
import Moveable from 'react-moveable'
import {
  ELEMENT_CATEGORIES,
  SCENE_CATEGORIES,
  PATTERN_CATEGORIES,
  getElementsByCategory,
  getScenesByCategory,
  getPatternsByCategory,
  getElementPath,
  getElementThumbPath,
  getScenePath,
  getSceneThumbPath,
  getPatternPath,
  getPatternThumbPath,
} from '../lib/assetCategories'

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

const PREVIEW_CARD_RADIUS_PX = 8

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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function normalizeRotation(deg) {
  const normalized = ((deg % 360) + 360) % 360
  return normalized >= 180 ? normalized - 360 : normalized
}

function formatRotationLabel(deg) {
  return `${Math.round(normalizeRotation(deg))}°`
}

// ============================================
// FRAME STATE HELPERS (hide/swap + undo/redo)
// ============================================
const MAX_FRAME_HISTORY = 50
const FRAME_DRAG_THRESHOLD_PX = 6

function createDefaultFrameState(slotCount, photosLength) {
  const safeSlotCount = Math.max(0, slotCount || 0)
  const safePhotosLength = Math.max(0, photosLength || 0)
  const order = Array.from({ length: safeSlotCount }, (_, i) => (
    i < safePhotosLength ? i : null
  ))
  return {
    visibility: Array(safeSlotCount).fill(true),
    order,
  }
}

function normalizeFrameState(prevState, slotCount, photosLength) {
  if (!prevState) {
    return createDefaultFrameState(slotCount, photosLength)
  }

  const safeSlotCount = Math.max(0, slotCount || 0)
  const safePhotosLength = Math.max(0, photosLength || 0)
  const nextVisibility = Array.from({ length: safeSlotCount }, (_, i) => (
    typeof prevState.visibility?.[i] === 'boolean' ? prevState.visibility[i] : true
  ))

  const nextOrder = Array(safeSlotCount).fill(null)
  const usedPhotoIndices = new Set()

  // First, keep any valid, non-duplicate photo assignments.
  for (let i = 0; i < safeSlotCount; i += 1) {
    const photoIndex = prevState.order?.[i]
    const isValidIndex = Number.isInteger(photoIndex) && photoIndex >= 0 && photoIndex < safePhotosLength
    if (!isValidIndex || usedPhotoIndices.has(photoIndex)) continue
    nextOrder[i] = photoIndex
    usedPhotoIndices.add(photoIndex)
  }

  // Then, fill remaining slots with any unassigned photos in order.
  let nextPhotoIndex = 0
  for (let i = 0; i < safeSlotCount; i += 1) {
    if (nextOrder[i] !== null) continue
    while (nextPhotoIndex < safePhotosLength && usedPhotoIndices.has(nextPhotoIndex)) {
      nextPhotoIndex += 1
    }
    if (nextPhotoIndex < safePhotosLength) {
      nextOrder[i] = nextPhotoIndex
      usedPhotoIndices.add(nextPhotoIndex)
      nextPhotoIndex += 1
    }
  }

  return {
    visibility: nextVisibility,
    order: nextOrder,
  }
}

function areFrameStatesEqual(a, b) {
  if (!a || !b) return false
  if (a.visibility.length !== b.visibility.length) return false
  if (a.order.length !== b.order.length) return false
  for (let i = 0; i < a.visibility.length; i += 1) {
    if (a.visibility[i] !== b.visibility[i]) return false
    if (a.order[i] !== b.order[i]) return false
  }
  return true
}

function getPhotoLabel(photoIndex, slotIndex) {
  if (Number.isInteger(photoIndex)) {
    return `Photo ${photoIndex + 1}`
  }
  return `Photo ${slotIndex + 1}`
}

// ============================================
// BACKGROUND THUMBNAIL COMPONENT (Memoized)
// - Receives num + onSelect to avoid inline callback props
// ============================================
const BackgroundThumbnail = memo(function BackgroundThumbnail({ num, type, isSelected, onSelect }) {
  const [loaded, setLoaded] = useState(false)
  const ref = useRef(null)
  const [isInView, setIsInView] = useState(false)
  
  const thumbSrc = type === BG_TYPES.SCENE ? getSceneThumbPath(num) : getPatternThumbPath(num)
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
          backgroundImage: isInView ? `url(${thumbSrc})` : 'none',
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
          src={thumbSrc}
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
  const thumbSrc = getElementThumbPath(num)
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
          src={thumbSrc}
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
// ============================================
const ELEMENT_BASE_SIZE_PX = 80
const ELEMENT_DUPLICATE_OFFSET = 2.5
const ROTATE_HANDLE_OFFSET_PX = 36
const MIN_ELEMENT_SCALE = 0.3
const MAX_ELEMENT_SCALE = 8
const ELEMENT_VISIBLE_MARGIN_PX = 12

const PlacedElement = memo(function PlacedElement({ element, containerRect, isSelected, onSelect, isExporting }) {
  const size = element.scale * ELEMENT_BASE_SIZE_PX
  
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
    </div>
  )
})

const ElementToolbar = memo(function ElementToolbar({ position, locked, onToggleLock, onDuplicate, onDelete }) {
  if (!position) return null

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      <div
        className="element-toolbar"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      >
        <button
          type="button"
          className="element-toolbar-btn"
          aria-label={locked ? 'Unlock element' : 'Lock element'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleLock()
          }}
        >
          {locked ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 10V7a5 5 0 0 1 10 0v3" />
              <rect x="5" y="10" width="14" height="10" rx="2" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 10V7a5 5 0 0 0-10 0" />
              <rect x="5" y="10" width="14" height="10" rx="2" />
            </svg>
          )}
        </button>
        <button
          type="button"
          className="element-toolbar-btn"
          aria-label="Duplicate element"
          onClick={(e) => {
            e.stopPropagation()
            onDuplicate()
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <rect x="4" y="4" width="11" height="11" rx="2" />
          </svg>
        </button>
        <button
          type="button"
          className="element-toolbar-btn element-toolbar-danger"
          aria-label="Delete element"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M6 6l1 14h10l1-14" />
          </svg>
        </button>
      </div>
    </div>
  )
})

const ElementRotateLabel = memo(function ElementRotateLabel({ position, label }) {
  if (!position || !label) return null

  return (
    <div className="absolute inset-0 pointer-events-none element-rotate-label-layer">
      <div
        className="element-rotate-label-anchor"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      >
        <div className="element-rotate-label" aria-live="polite">
          {label}
        </div>
      </div>
    </div>
  )
})

// ============================================
// MAIN EDITOR COMPONENT
// ============================================
function Editor({ photos, layout, orientation, onComplete, onReset }) {
  // Grid config is needed for both rendering and frame state initialization.
  const gridConfig = getGridConfig(layout, orientation) || { rows: 1, cols: 1 }
  const { rows, cols } = gridConfig
  const slotCount = layout?.shots || (rows * cols)
  const photosLength = photos?.length || 0

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
  const [toolbarPosition, setToolbarPosition] = useState(null)
  const [rotationHandlePosition, setRotationHandlePosition] = useState(null)
  const [isRotating, setIsRotating] = useState(false)
  const [rotationLabel, setRotationLabel] = useState(null)
  
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

  // Frame editing state (hide + drag-to-swap with undo/redo)
  const [isFrameEditMode, setIsFrameEditMode] = useState(false)
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(null)
  const [dragSourceFrameIndex, setDragSourceFrameIndex] = useState(null)
  const [dragOverFrameIndex, setDragOverFrameIndex] = useState(null)
  const [frameState, setFrameState] = useState(() => createDefaultFrameState(slotCount, photosLength))
  const [frameHistory, setFrameHistory] = useState([])
  const [frameFuture, setFrameFuture] = useState([])
  const frameStateRef = useRef(frameState)
  const dragSourceRef = useRef(null)
  const dragOverRef = useRef(null)
  const dragPointerIdRef = useRef(null)
  const pointerStartRef = useRef(null)
  const prevFrameShapeRef = useRef({ slotCount, photosLength, rows, cols })

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
  const isVertical = orientation?.id === 'vertical'
  const canvasAspect = orientation ? (orientation.width / orientation.height) : (16/9)

  const { paddingRatio, gapRatio } = getSpacingRatios(orientation)

  const getPreviewPhotoSize = () => {
    if (!containerRect.width || !containerRect.height) return null
    const padX = containerRect.width * paddingRatio
    const padY = containerRect.height * paddingRatio
    const gapX = containerRect.width * gapRatio
    const gapY = containerRect.height * gapRatio
    const availableWidth = containerRect.width - (padX * 2) - (gapX * (cols - 1))
    const availableHeight = containerRect.height - (padY * 2) - (gapY * (rows - 1))
    return {
      width: availableWidth / cols,
      height: availableHeight / rows,
    }
  }
  
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

  // Keep a ref to the latest frame state for undo/redo helpers.
  useEffect(() => {
    frameStateRef.current = frameState
  }, [frameState])

  // If the layout shape or photo count changes, reset frame edits safely.
  useEffect(() => {
    const prevShape = prevFrameShapeRef.current
    if (
      prevShape.slotCount === slotCount &&
      prevShape.photosLength === photosLength &&
      prevShape.rows === rows &&
      prevShape.cols === cols
    ) {
      return
    }
    prevFrameShapeRef.current = { slotCount, photosLength, rows, cols }

    const defaultState = createDefaultFrameState(slotCount, photosLength)
    setFrameState(defaultState)
    frameStateRef.current = defaultState
    setFrameHistory([])
    setFrameFuture([])
    setSelectedFrameIndex(null)
    setDragSourceFrameIndex(null)
    setDragOverFrameIndex(null)
    dragSourceRef.current = null
    dragOverRef.current = null
    dragPointerIdRef.current = null
    pointerStartRef.current = null
    setIsFrameEditMode(false)
  }, [slotCount, photosLength, rows, cols])

  // Entering frame edit mode should disable element interactions.
  useEffect(() => {
    if (!isFrameEditMode) {
      setSelectedFrameIndex(null)
      setDragSourceFrameIndex(null)
      setDragOverFrameIndex(null)
      dragSourceRef.current = null
      dragOverRef.current = null
      dragPointerIdRef.current = null
      pointerStartRef.current = null
      return
    }
    setSelectedElementId(null)
    setIsRotating(false)
    setRotationLabel(null)
  }, [isFrameEditMode])


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
  // FRAME HANDLERS (hide/drag-swap + undo/redo)
  // ----------------------------------------
  const canUndoFrames = frameHistory.length > 0
  const canRedoFrames = frameFuture.length > 0
  const isFrameDragActive = dragSourceFrameIndex !== null

  const applyFrameAction = useCallback((updater) => {
    setFrameState(prev => {
      const candidate = typeof updater === 'function' ? updater(prev) : prev
      const normalized = normalizeFrameState(candidate, slotCount, photosLength)
      if (areFrameStatesEqual(prev, normalized)) {
        return prev
      }
      setFrameHistory(history => [
        ...history.slice(-(MAX_FRAME_HISTORY - 1)),
        prev,
      ])
      setFrameFuture([])
      frameStateRef.current = normalized
      return normalized
    })
  }, [slotCount, photosLength])

  const undoFrameAction = useCallback(() => {
    setFrameHistory(history => {
      if (!history.length) return history
      const previousRaw = history[history.length - 1]
      const previous = normalizeFrameState(previousRaw, slotCount, photosLength)
      const current = normalizeFrameState(frameStateRef.current, slotCount, photosLength)
      setFrameFuture(future => [current, ...future].slice(0, MAX_FRAME_HISTORY))
      setFrameState(previous)
      frameStateRef.current = previous
      return history.slice(0, -1)
    })
  }, [slotCount, photosLength])

  const redoFrameAction = useCallback(() => {
    setFrameFuture(future => {
      if (!future.length) return future
      const nextRaw = future[0]
      const next = normalizeFrameState(nextRaw, slotCount, photosLength)
      const current = normalizeFrameState(frameStateRef.current, slotCount, photosLength)
      setFrameHistory(history => [
        ...history.slice(-(MAX_FRAME_HISTORY - 1)),
        current,
      ])
      setFrameState(next)
      frameStateRef.current = next
      return future.slice(1)
    })
  }, [slotCount, photosLength])

  const toggleFrameEditMode = useCallback(() => {
    setIsFrameEditMode(prev => {
      const next = !prev
      if (!next) {
        setSelectedFrameIndex(null)
        setDragSourceFrameIndex(null)
        setDragOverFrameIndex(null)
        dragSourceRef.current = null
        dragOverRef.current = null
        dragPointerIdRef.current = null
        pointerStartRef.current = null
      }
      return next
    })
  }, [])

  const swapFrames = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    applyFrameAction(state => {
      const nextOrder = state.order.slice()
      const tmp = nextOrder[fromIndex]
      nextOrder[fromIndex] = nextOrder[toIndex]
      nextOrder[toIndex] = tmp
      return { ...state, order: nextOrder }
    })
  }, [applyFrameAction])

  const showAllFrames = useCallback(() => {
    applyFrameAction(state => ({
      ...state,
      visibility: state.visibility.map(() => true),
    }))
  }, [applyFrameAction])

  const toggleFrameVisibility = useCallback((slotIndex) => {
    applyFrameAction(state => {
      const nextVisibility = state.visibility.slice()
      const currentlyVisible = state.visibility[slotIndex] !== false
      nextVisibility[slotIndex] = !currentlyVisible
      return { ...state, visibility: nextVisibility }
    })
  }, [applyFrameAction])

  // Keep refs in sync with state for pointer-based dragging.
  useEffect(() => {
    dragSourceRef.current = dragSourceFrameIndex
  }, [dragSourceFrameIndex])

  useEffect(() => {
    dragOverRef.current = dragOverFrameIndex
  }, [dragOverFrameIndex])

  const clearFrameDragState = useCallback(() => {
    setDragSourceFrameIndex(null)
    setDragOverFrameIndex(null)
    dragSourceRef.current = null
    dragOverRef.current = null
    dragPointerIdRef.current = null
    pointerStartRef.current = null
  }, [])

  const handleFramePointerDown = useCallback((slotIndex, canDrag, event) => {
    if (!isFrameEditMode) return
    event.stopPropagation()
    setSelectedFrameIndex(slotIndex)

    if (!canDrag) {
      clearFrameDragState()
      return
    }

    dragPointerIdRef.current = event.pointerId ?? null
    pointerStartRef.current = {
      slotIndex,
      startX: event.clientX,
      startY: event.clientY,
      canDrag,
      pointerId: dragPointerIdRef.current,
    }
    // Reset any prior drag state. We only start dragging after moving past a threshold.
    setDragSourceFrameIndex(null)
    setDragOverFrameIndex(null)
    dragSourceRef.current = null
    dragOverRef.current = null
  }, [isFrameEditMode, clearFrameDragState])

  // Pointer-based drag tracking (more reliable than HTML5 drag/drop here).
  useEffect(() => {
    if (!isFrameEditMode) return

    const handlePointerMove = (event) => {
      const start = pointerStartRef.current
      if (!start) return
      if (start.pointerId !== null && event.pointerId !== undefined && event.pointerId !== start.pointerId) {
        return
      }

      // Start dragging only after a small movement threshold so taps can select.
      if (dragSourceRef.current === null) {
        if (!start.canDrag) return
        const dx = event.clientX - start.startX
        const dy = event.clientY - start.startY
        const distance = Math.hypot(dx, dy)
        if (distance < FRAME_DRAG_THRESHOLD_PX) return

        dragSourceRef.current = start.slotIndex
        dragOverRef.current = start.slotIndex
        setDragSourceFrameIndex(start.slotIndex)
        setDragOverFrameIndex(start.slotIndex)
      }

      const el = document.elementFromPoint(event.clientX, event.clientY)
      const slotEl = el?.closest?.('[data-frame-slot-index]')
      const nextIndex = slotEl ? Number(slotEl.dataset.frameSlotIndex) : null
      if (Number.isInteger(nextIndex)) {
        if (nextIndex !== dragOverRef.current) {
          setDragOverFrameIndex(nextIndex)
        }
      } else if (dragOverRef.current !== null) {
        setDragOverFrameIndex(null)
      }
    }

    const handlePointerUp = (event) => {
      const start = pointerStartRef.current
      if (start?.pointerId !== null && event.pointerId !== undefined && event.pointerId !== start.pointerId) {
        return
      }
      const source = dragSourceRef.current ?? dragSourceFrameIndex
      const target = dragOverRef.current ?? dragOverFrameIndex
      if (Number.isInteger(source) && Number.isInteger(target) && source !== target) {
        swapFrames(source, target)
        setSelectedFrameIndex(target)
      } else if (start?.slotIndex !== undefined && start?.slotIndex !== null) {
        // A tap (no drag) should still leave the frame selected.
        setSelectedFrameIndex(start.slotIndex)
      }
      clearFrameDragState()
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [
    isFrameEditMode,
    dragSourceFrameIndex,
    dragOverFrameIndex,
    swapFrames,
    clearFrameDragState,
  ])

  const frameSlots = useMemo(() => {
    const normalized = normalizeFrameState(frameState, slotCount, photosLength)
    return Array.from({ length: slotCount }, (_, slotIndex) => {
      const photoIndex = normalized.order[slotIndex]
      const photoSrc = Number.isInteger(photoIndex) ? photos?.[photoIndex] : null
      const isVisible = normalized.visibility[slotIndex] !== false
      return {
        slotIndex,
        photoIndex,
        photoSrc,
        isVisible,
        label: getPhotoLabel(photoIndex, slotIndex),
      }
    })
  }, [frameState, slotCount, photosLength, photos])

  const selectedFrame = selectedFrameIndex !== null ? frameSlots[selectedFrameIndex] : null
  const hasSelectedFrame = Boolean(selectedFrame)
  const selectedFrameVisible = selectedFrame?.isVisible !== false
  const hasHiddenFrames = frameSlots.some(slot => !slot.isVisible)

  const toggleSelectedFrameVisibility = useCallback(() => {
    if (selectedFrameIndex === null || !frameSlots[selectedFrameIndex]) return
    toggleFrameVisibility(selectedFrameIndex)
  }, [selectedFrameIndex, frameSlots, toggleFrameVisibility])

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

  const toggleElementLock = useCallback((id) => {
    setPlacedElements(prev =>
      prev.map(el => (el.id === id ? { ...el, locked: !el.locked } : el))
    )
  }, [])

  const duplicateElement = useCallback((id) => {
    let newId = null
    setPlacedElements(prev => {
      const original = prev.find(el => el.id === id)
      if (!original) return prev
      newId = Date.now() + Math.random()
      const duplicate = {
        ...original,
        id: newId,
        locked: false,
        x: Math.max(0, Math.min(100, original.x + ELEMENT_DUPLICATE_OFFSET)),
        y: Math.max(0, Math.min(100, original.y + ELEMENT_DUPLICATE_OFFSET)),
      }
      return [...prev, duplicate]
    })
    if (newId) {
      setSelectedElementId(newId)
    }
  }, [])

  const deleteElement = useCallback((id) => {
    setPlacedElements(prev => prev.filter(el => el.id !== id))
    setSelectedElementId(null)
  }, [])

  const deselectAll = useCallback(() => {
    setSelectedElementId(null)
    setIsRotating(false)
    setRotationLabel(null)
    setSelectedFrameIndex(null)
    setDragSourceFrameIndex(null)
    setDragOverFrameIndex(null)
    dragSourceRef.current = null
    dragOverRef.current = null
    dragPointerIdRef.current = null
    pointerStartRef.current = null
  }, [])

  const selectedElement = placedElements.find(el => el.id === selectedElementId)
  const selectedLocked = selectedElement?.locked
  const showToolbar = selectedElementId && toolbarPosition && !isExporting && !isRotating && !isFrameEditMode
  const showRotationLabel = isRotating && rotationLabel && rotationHandlePosition && !isExporting && !isFrameEditMode

  const updateToolbarPosition = useCallback((targetEl) => {
    const container = canvasContainerRef.current
    if (!container || !selectedElementId) {
      setToolbarPosition(null)
      setRotationHandlePosition(null)
      return
    }
    const elementEl = targetEl || container.querySelector(`.placed-element[data-element-id="${selectedElementId}"]`)
    if (!elementEl) {
      setToolbarPosition(null)
      setRotationHandlePosition(null)
      return
    }
    const containerBox = container.getBoundingClientRect()
    const elBox = elementEl.getBoundingClientRect()
    const x = elBox.left - containerBox.left + elBox.width / 2
    const y = Math.max(12, elBox.top - containerBox.top - 8)
    setToolbarPosition({ x, y })

    const handleX = clamp(
      elBox.right - containerBox.left + ROTATE_HANDLE_OFFSET_PX,
      12,
      containerBox.width - 12
    )
    const handleY = clamp(
      elBox.top - containerBox.top + elBox.height / 2,
      12,
      containerBox.height - 12
    )
    setRotationHandlePosition({ x: handleX, y: handleY })
  }, [selectedElementId])

  const getClampedPercent = useCallback((centerPx, sizePx, containerSize) => {
    const min = -sizePx / 2 + ELEMENT_VISIBLE_MARGIN_PX
    const max = containerSize + sizePx / 2 - ELEMENT_VISIBLE_MARGIN_PX
    return (clamp(centerPx, min, max) / containerSize) * 100
  }, [])

  const handleRotateStart = useCallback(() => {
    setIsRotating(true)
    setRotationLabel(formatRotationLabel(selectedElement?.rotation ?? 0))
  }, [selectedElement])

  const handleRotate = useCallback(({ target, transform, rotation }) => {
    target.style.transform = transform
    updateToolbarPosition(target)
    if (typeof rotation === 'number') {
      setRotationLabel(formatRotationLabel(rotation))
    }
  }, [updateToolbarPosition])

  const handleRotateEnd = useCallback(({ lastEvent }) => {
    if (lastEvent && selectedElementId) {
      const nextRotation = typeof lastEvent.rotation === 'number' ? lastEvent.rotation : lastEvent.rotate
      if (typeof nextRotation === 'number') {
        updateElement(selectedElementId, { rotation: nextRotation })
      }
    }
    updateToolbarPosition()
    setIsRotating(false)
    setRotationLabel(null)
  }, [selectedElementId, updateElement, updateToolbarPosition])

  useEffect(() => {
    if (!selectedElementId || isExporting || isFrameEditMode) {
      setToolbarPosition(null)
      setRotationHandlePosition(null)
      setIsRotating(false)
      setRotationLabel(null)
      return
    }
    updateToolbarPosition()
  }, [selectedElementId, placedElements, containerRect.width, containerRect.height, isExporting, isFrameEditMode, updateToolbarPosition])

  // Keyboard delete for selected element
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedElementId) return
      if (e.key !== 'Delete' && e.key !== 'Backspace') return

      const target = e.target
      const isEditable = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      )
      if (isEditable) return

      e.preventDefault()
      deleteElement(selectedElementId)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementId, deleteElement])

  // Keyboard shortcuts: undo/redo frame edits and escape to exit frame mode.
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target
      const isEditable = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      )
      if (isEditable) return

      if (e.key === 'Escape' && isFrameEditMode) {
        e.preventDefault()
        if (dragSourceFrameIndex !== null || dragOverFrameIndex !== null) {
          setDragSourceFrameIndex(null)
          setDragOverFrameIndex(null)
          dragSourceRef.current = null
          dragOverRef.current = null
          dragPointerIdRef.current = null
          pointerStartRef.current = null
        } else if (selectedFrameIndex !== null) {
          setSelectedFrameIndex(null)
        } else {
          setIsFrameEditMode(false)
        }
        return
      }

      const isMeta = e.metaKey || e.ctrlKey
      if (!isMeta) return

      const key = String(e.key || '').toLowerCase()
      if (key === 'z') {
        const shouldRedo = e.shiftKey
        const canAct = shouldRedo ? canRedoFrames : canUndoFrames
        if (!canAct) return
        e.preventDefault()
        if (shouldRedo) redoFrameAction()
        else undoFrameAction()
        return
      }

      if (key === 'y') {
        if (!canRedoFrames) return
        e.preventDefault()
        redoFrameAction()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    isFrameEditMode,
    dragSourceFrameIndex,
    dragOverFrameIndex,
    selectedFrameIndex,
    canUndoFrames,
    canRedoFrames,
    undoFrameAction,
    redoFrameAction,
  ])


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
    const padX = containerRect.width * paddingRatio
    const padY = containerRect.height * paddingRatio
    const gapX = containerRect.width * gapRatio
    const gapY = containerRect.height * gapRatio
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      columnGap: `${gapX}px`,
      rowGap: `${gapY}px`,
      padding: `${padY}px ${padX}px`,
      height: '100%',
    }
  }

  const renderPhotoGrid = () => (
    <div className="relative z-10" style={getPhotoGridStyle()}>
      {frameSlots.map((slot) => {
        const isSelected = selectedFrameIndex === slot.slotIndex
        const isDragSource = dragSourceFrameIndex === slot.slotIndex
        const isDragTarget = dragOverFrameIndex === slot.slotIndex && dragSourceFrameIndex !== slot.slotIndex
        const canDrag = isFrameEditMode && slot.isVisible && Boolean(slot.photoSrc)
        const isDimmedByDrag = isFrameEditMode && isFrameDragActive && !isDragSource && !isDragTarget

        const photoAlt = Number.isInteger(slot.photoIndex)
          ? `Photo ${slot.photoIndex + 1}`
          : `Photo ${slot.slotIndex + 1}`

        const slotClasses = [
          'relative overflow-hidden rounded-lg transition-all duration-150 select-none',
          isFrameEditMode ? (canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer') : 'cursor-default',
          canDrag ? 'touch-none' : '',
          slot.isVisible
            ? 'bg-white shadow-md'
            : (isFrameEditMode ? 'bg-white/5 shadow-none' : 'bg-transparent shadow-none'),
          isFrameEditMode ? 'border border-white/25' : '',
          isSelected ? 'ring-1 ring-[#B8001F] ring-offset-1 scale-[1.005]' : '',
          isDragSource ? 'ring-1 ring-[#B8001F] ring-offset-1 opacity-85 scale-[1.005]' : '',
          isDragTarget ? 'ring-1 ring-white/80 ring-offset-1 scale-[1.01]' : '',
          isDimmedByDrag ? 'opacity-70' : '',
        ].filter(Boolean).join(' ')

        return (
          <div
            key={slot.slotIndex}
            className={slotClasses}
            style={{ '--tw-ring-offset-color': 'rgba(15, 23, 42, 0.35)' }}
            data-frame-slot-index={slot.slotIndex}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => handleFramePointerDown(slot.slotIndex, canDrag, e)}
          >
            {slot.isVisible && slot.photoSrc && (
              <img
                src={slot.photoSrc}
                alt={photoAlt}
                className="w-full h-full object-cover"
                draggable={false}
              />
            )}

            {isFrameEditMode && (
              <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none">
                <div className="flex items-center justify-between gap-2">
                  <div className="px-3 py-1.5 rounded-md text-[11px] font-semibold bg-black/60 text-white/90 shadow-sm" style={{paddingTop:"5px", paddingBottom:"5px", paddingLeft:"10px", paddingRight:"10px"}}>
                    {slot.label}
                  </div>
                </div>

                <div className="flex items-end justify-between gap-2">
                  {isSelected && (
                    <button
                      type="button"
                      className="pointer-events-auto px-3 py-1.5 rounded-md text-[11px] font-semibold bg-black/75 text-white hover:bg-black/85 transition-colors shadow-sm"
                      style={{paddingTop:"5px", paddingBottom:"5px", paddingLeft:"10px", paddingRight:"10px"}}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFrameVisibility(slot.slotIndex)
                      }}
                    >
                      {slot.isVisible ? 'Hide' : 'Show'}
                    </button>
                  )}
                  {!slot.isVisible && (
                    <div className="ml-auto px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-[#B8001F]/90 text-white shadow-sm"
                    style={{paddingTop:"5px", paddingBottom:"5px", paddingLeft:"10px", paddingRight:"10px"}}>
                      Hidden
                    </div>
                  )}
                </div>

                {isDragSource && isFrameDragActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/75 text-white">
                      Dragging
                    </div>
                  </div>
                )}
                {isDragTarget && isFrameDragActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/75 text-white">
                      Drop to swap
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  // ----------------------------------------
  // EXPORT FUNCTION - Pixel-identical to preview
  // ----------------------------------------
  const handleExport = async () => {
    if (!exportCanvasRef.current || !loadedPhotos.length) return

    const supportsDownloadAttr = () => {
      const link = document.createElement('a')
      return typeof link.download !== 'undefined'
    }

    // Hide selection UI during export
    setIsExporting(true)
    setSelectedElementId(null)
    
    try {
      // Wait for UI to settle
      await new Promise(r => setTimeout(r, 50))

      const canvas = exportCanvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      const deviceScale = Math.min(Math.max((window.devicePixelRatio || 1), 1.5), 2)
      const baseWidth = orientation?.width || 1080
      const baseHeight = orientation?.height || 1920
      const minPhotoScale = loadedPhotos.length
        ? Math.min(...loadedPhotos.filter(Boolean).map(img => img.width / baseWidth))
        : 1
      const exportScale = Math.max(1, Math.min(deviceScale, minPhotoScale || 1))

      const canvasWidth = Math.round(baseWidth * exportScale)
      const canvasHeight = Math.round(baseHeight * exportScale)

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
      const paddingX = canvasWidth * paddingRatio
      const paddingY = canvasHeight * paddingRatio
      const gapX = canvasWidth * gapRatio
      const gapY = canvasHeight * gapRatio

      const availableWidth = canvasWidth - (paddingX * 2) - (gapX * (cols - 1))
      const availableHeight = canvasHeight - (paddingY * 2) - (gapY * (rows - 1))

      const photoWidth = availableWidth / cols
      const photoHeight = availableHeight / rows
      const previewSize = getPreviewPhotoSize()
      const cornerScale = previewSize ? (photoWidth / previewSize.width) : 1
      const cornerRadius = previewSize
        ? PREVIEW_CARD_RADIUS_PX * cornerScale
        : Math.min(photoWidth, photoHeight) * 0.02

      const exportFrameState = normalizeFrameState(frameStateRef.current, slotCount, photosLength)

      for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
        const isVisible = exportFrameState.visibility[slotIndex] !== false
        if (!isVisible) continue

        const photoIndex = exportFrameState.order[slotIndex]
        if (!Number.isInteger(photoIndex)) continue

        const img = loadedPhotos[photoIndex]
        if (!img) continue

        const col = slotIndex % cols
        const row = Math.floor(slotIndex / cols)

        const x = paddingX + (col * (photoWidth + gapX))
        const y = paddingY + (row * (photoHeight + gapY))

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
      }

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
          
        // Match preview element size/position by scaling from preview pixels
        const previewWidth = containerRect?.width || 0
        const exportScale = previewWidth ? (canvasWidth / previewWidth) : 1
        const size = ELEMENT_BASE_SIZE_PX * element.scale * exportScale

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

      const blob = await new Promise((resolve, reject) => {
        if (canvas.toBlob) {
          canvas.toBlob((result) => {
            if (result) {
              resolve(result)
            } else {
              reject(new Error('Export failed'))
            }
          }, 'image/png')
        } else {
          // Older Safari fallback: dataURL -> fetch -> blob
          fetch(canvas.toDataURL('image/png'))
            .then(res => res.blob())
            .then(resolve)
            .catch(reject)
        }
      })

      const blobUrl = URL.createObjectURL(blob)
      const canDownload = supportsDownloadAttr()

      if (canDownload) {
        const link = document.createElement('a')
        link.download = `snap-photo-${Date.now()}.png`
        link.href = blobUrl
        link.target = '_self'
        link.rel = 'noopener'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        window.location.href = blobUrl
      }

      // Only compute data URL if someone is listening for completion
      if (onComplete) {
        const reader = new FileReader()
        reader.onloadend = () => onComplete(reader.result)
        reader.readAsDataURL(blob)
      }

      // Give the browser time to start navigation before revoking
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
    } catch (err) {
      console.error('Failed to export image:', err)
    } finally {
      setIsExporting(false)
    }
  }

  // ----------------------------------------
  // RENDER
  // ----------------------------------------
  
  // Panel content - shared between side panel and bottom sheet
  const renderPanelContent = (isBottomSheet = false) => {
    if (isFrameEditMode) {
      return (
        <FrameEditPanel
          isBottomSheet={isBottomSheet}
          frameSlots={frameSlots}
          selectedFrameIndex={selectedFrameIndex}
          selectedFrame={selectedFrame}
          selectedFrameVisible={selectedFrameVisible}
          hasSelectedFrame={hasSelectedFrame}
          hasHiddenFrames={hasHiddenFrames}
          canUndoFrames={canUndoFrames}
          canRedoFrames={canRedoFrames}
          isExportDisabled={!loadedPhotos.length}
          onSelectFrame={setSelectedFrameIndex}
          onUndo={undoFrameAction}
          onRedo={redoFrameAction}
          onToggleSelectedVisibility={toggleSelectedFrameVisibility}
          onShowAll={showAllFrames}
          onExport={handleExport}
          onReset={onReset}
          onDoneEditing={toggleFrameEditMode}
        />
      )
    }

    return (
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
          <p className="text-[10px] font-bold text-center text-[var(--color-text-muted)]"
          style={{ paddingTop: '3px', paddingBottom: '3px' }}>
            Click to add elements to your photo
          </p>
        )}

        {/* Divider after Level 2 */}
        <div className="border-t border-[var(--card-border)]" style={{ marginTop: '2px', marginBottom: '5px' }} />

        {/* Level 3: Category chips */}
        <div 
          className="flex gap-1.5 overflow-x-auto py-1 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {activeTab === TABS.BACKGROUND && bgType !== BG_TYPES.SOLID && Object.entries(bgCategories).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setBgCategory(key)}
              className={`rounded-full text-[10px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${
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
              className={`rounded-full text-[10px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${
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
          className="w-full py-2.5 rounded-lg btn-primary text-white font-bold text-[15px]
                     shadow-md hover:shadow-lg hover:shadow-[#B8001F]/15 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Download
        </button>
         <div className="mt-4 flex items-center justify-center gap-3"
        style={{marginTop: '5px'}}>
          <button
            onClick={onReset}
            className="py-2 text-sm font-bold transition-all
                       text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            style={{ background: 'transparent', marginRight: '4px' }}
          >
            Start Over
          </button>
          <span
            className="h-4 bg-[var(--color-text-secondary)] opacity-60"
            style={{ width: '1.5px' }}
          />
          <button
            type="button"
            onClick={toggleFrameEditMode}
            aria-pressed={isFrameEditMode}
            className="py-2 text-sm font-bold frame-edit-action"
            style={{ background: 'transparent', marginLeft: '4px' }}
          >
            Edit Frames
          </button>
        </div>
      </div>
    </>
    )
  }
  
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

              {isFrameEditMode && (
                <div className="absolute inset-x-0 top-3 z-[70] flex justify-center pointer-events-none">
                  <div className="px-4 py-2 rounded-full text-[11px] font-semibold bg-black/70 text-white shadow-sm">
                    {isFrameDragActive ? 'Drop on another frame to swap' : 'Swap frames • Tap to hide/show'}
                  </div>
                </div>
              )}

              {/* Photo Grid */}
              {renderPhotoGrid()}

              {/* Placed Elements */}
              <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
                <div
                  className="relative w-full h-full"
                  style={{ pointerEvents: isFrameEditMode ? 'none' : 'auto' }}
                >
                  {placedElements.map(element => (
                    <PlacedElement
                      key={element.id}
                      element={element}
                      containerRect={containerRect}
                      isSelected={element.id === selectedElementId}
                      onSelect={setSelectedElementId}
                      isExporting={isExporting}
                    />
                  ))}
                </div>
              </div>

              {/* Rotation label */}
              {showRotationLabel && (
                <ElementRotateLabel
                  position={rotationHandlePosition}
                  label={rotationLabel}
                />
              )}

              {/* Element toolbar */}
              {showToolbar && (
                <ElementToolbar
                  position={toolbarPosition}
                  locked={selectedLocked}
                  onToggleLock={() => toggleElementLock(selectedElementId)}
                  onDuplicate={() => duplicateElement(selectedElementId)}
                  onDelete={() => deleteElement(selectedElementId)}
                />
              )}

              {/* Moveable */}
              {selectedElementId && !isExporting && !selectedLocked && !isFrameEditMode && (
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
                  rotationPosition="right"
                  origin={false}
                  padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
                  onDrag={({ target, transform }) => {
                    target.style.transform = transform
                    updateToolbarPosition(target)
                  }}
                  onDragEnd={({ target }) => {
                    const container = canvasContainerRef.current
                    if (!container) return
                    const containerRect = container.getBoundingClientRect()
                    const elRect = target.getBoundingClientRect()
                    const centerX = elRect.left - containerRect.left + elRect.width / 2
                    const centerY = elRect.top - containerRect.top + elRect.height / 2
                    updateElement(selectedElementId, {
                      x: getClampedPercent(centerX, elRect.width, containerRect.width),
                      y: getClampedPercent(centerY, elRect.height, containerRect.height),
                    })
                    updateToolbarPosition(target)
                  }}
                  onRotateStart={handleRotateStart}
                  onRotate={handleRotate}
                  onRotateEnd={handleRotateEnd}
                  onResize={({ target, width, height, drag }) => {
                    target.style.width = `${width}px`
                    target.style.height = `${height}px`
                    target.style.transform = drag.transform
                    updateToolbarPosition(target)
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
                    const newScale = newWidth / ELEMENT_BASE_SIZE_PX
                    updateElement(selectedElementId, { 
                      scale: clamp(newScale, MIN_ELEMENT_SCALE, MAX_ELEMENT_SCALE),
                      x: getClampedPercent(centerX, elRect.width, containerRect.width),
                      y: getClampedPercent(centerY, elRect.height, containerRect.height),
                    })
                    updateToolbarPosition(target)
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

            {isFrameEditMode && (
              <div className="absolute inset-x-0 top-3 z-[70] flex justify-center pointer-events-none">
                <div className="px-4 py-2 rounded-full text-[11px] font-semibold bg-black/40 text-white shadow-sm"
                style={{padding:"5px", marginTop:"-10px"}}>
                  {isFrameDragActive ? 'Drop on another frame to swap' : 'Swap frames • Tap to hide/show'}
                </div>
              </div>
            )}

            {/* Photo Grid - LAYER 2 (stable, doesn't remount on bg change) */}
            {renderPhotoGrid()}

            {/* Placed Elements - LAYER 3 (clipped to frame) */}
            <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
              <div
                className="relative w-full h-full"
                style={{ pointerEvents: isFrameEditMode ? 'none' : 'auto' }}
              >
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

            {/* Rotation label */}
            {showRotationLabel && (
              <ElementRotateLabel
                position={rotationHandlePosition}
                label={rotationLabel}
              />
            )}

            {/* Element toolbar */}
            {showToolbar && (
              <ElementToolbar
                position={toolbarPosition}
                locked={selectedLocked}
                onToggleLock={() => toggleElementLock(selectedElementId)}
                onDuplicate={() => duplicateElement(selectedElementId)}
                onDelete={() => deleteElement(selectedElementId)}
              />
            )}

            {/* Moveable for selected element - transform-only, single source of truth */}
            {selectedElementId && !isExporting && !selectedLocked && !isFrameEditMode && (
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
                rotationPosition="right"
                origin={false}
                // DRAG: Direct DOM transform update only
                onDrag={({ target, transform }) => {
                  target.style.transform = transform
                  updateToolbarPosition(target)
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
                    x: getClampedPercent(centerX, elRect.width, containerRect.width),
                    y: getClampedPercent(centerY, elRect.height, containerRect.height),
                  })
                  updateToolbarPosition(target)
                }}
                // ROTATE: Direct DOM transform update only
                onRotateStart={handleRotateStart}
                onRotate={handleRotate}
                onRotateEnd={handleRotateEnd}
                // RESIZE: Direct DOM update during resize
                onResize={({ target, width, height, drag }) => {
                  target.style.width = `${width}px`
                  target.style.height = `${height}px`
                  target.style.transform = drag.transform
                  updateToolbarPosition(target)
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
                  const newScale = newWidth / ELEMENT_BASE_SIZE_PX
                  updateElement(selectedElementId, { 
                    scale: clamp(newScale, MIN_ELEMENT_SCALE, MAX_ELEMENT_SCALE),
                    x: getClampedPercent(centerX, elRect.width, containerRect.width),
                    y: getClampedPercent(centerY, elRect.height, containerRect.height),
                  })
                  updateToolbarPosition(target)
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
