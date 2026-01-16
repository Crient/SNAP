import { useState, useRef, useEffect, useCallback } from 'react'
import { getGridConfig } from '../App'
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

// ============================================
// CONSTANTS
// ============================================
const TABS = {
  BACKGROUND: 'background',
  ELEMENTS: 'elements',
}

const BG_TYPES = {
  SCENE: 'scene',
  PATTERN: 'pattern',
}

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
// BACKGROUND THUMBNAIL COMPONENT
// ============================================
function BackgroundThumbnail({ src, isSelected, onClick, type }) {
  return (
    <button
      onClick={onClick}
      className={`relative aspect-square rounded-lg overflow-hidden transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-[#B8001F] ring-offset-2 ring-offset-[var(--color-glass)] scale-[1.02]'
          : 'hover:scale-[1.02] hover:ring-1 hover:ring-[var(--color-border)]'
      }`}
    >
      <img
        src={src}
        alt=""
        className="w-full h-full"
        style={{
          objectFit: type === BG_TYPES.SCENE ? 'cover' : 'none',
          objectPosition: 'center',
        }}
        loading="lazy"
      />
    </button>
  )
}

// ============================================
// ELEMENT THUMBNAIL COMPONENT
// ============================================
function ElementThumbnail({ src, onDragStart, onDragEnd }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e) => {
    setIsDragging(true)
    // Set drag data with element path
    e.dataTransfer.setData('text/plain', src)
    e.dataTransfer.effectAllowed = 'copy'
    
    // Create a small drag image
    const dragImg = new Image()
    dragImg.src = src
    e.dataTransfer.setDragImage(dragImg, 40, 40)
    
    onDragStart?.(src)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    onDragEnd?.()
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`relative aspect-square rounded-lg overflow-hidden cursor-grab active:cursor-grabbing 
                  transition-all duration-200 hover:scale-105 bg-[var(--color-surface)]/50 p-1
                  ${isDragging ? 'opacity-50' : ''}`}
    >
      <img
        src={src}
        alt=""
        className="w-full h-full object-contain"
        loading="lazy"
        draggable={false}
      />
    </div>
  )
}

// ============================================
// PLACED ELEMENT COMPONENT
// ============================================
function PlacedElement({ element, isSelected, onSelect, onUpdate, onDelete, containerRef }) {
  const elementRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback((e) => {
    e.stopPropagation()
    onSelect(element.id)
    
    if (!containerRef.current) return
    
    setIsDragging(true)
    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    
    const startX = e.clientX
    const startY = e.clientY
    const startPosX = element.x
    const startPosY = element.y

    const handleMove = (moveEvent) => {
      const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100
      const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100
      
      onUpdate(element.id, {
        x: Math.max(0, Math.min(100, startPosX + deltaX)),
        y: Math.max(0, Math.min(100, startPosY + deltaY)),
      })
    }

    const handleUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }, [element, onSelect, onUpdate, containerRef])

  const handleTouchStart = useCallback((e) => {
    e.stopPropagation()
    onSelect(element.id)
    
    if (!containerRef.current) return
    
    setIsDragging(true)
    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const touch = e.touches[0]
    
    const startX = touch.clientX
    const startY = touch.clientY
    const startPosX = element.x
    const startPosY = element.y

    const handleMove = (moveEvent) => {
      const t = moveEvent.touches[0]
      const deltaX = ((t.clientX - startX) / rect.width) * 100
      const deltaY = ((t.clientY - startY) / rect.height) * 100
      
      onUpdate(element.id, {
        x: Math.max(0, Math.min(100, startPosX + deltaX)),
        y: Math.max(0, Math.min(100, startPosY + deltaY)),
      })
    }

    const handleEnd = () => {
      setIsDragging(false)
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('touchend', handleEnd)
    }

    document.addEventListener('touchmove', handleMove, { passive: false })
    document.addEventListener('touchend', handleEnd)
  }, [element, onSelect, onUpdate, containerRef])

  return (
    <div
      ref={elementRef}
      className={`absolute cursor-move select-none transition-shadow ${
        isSelected ? 'z-50' : 'z-40'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        transform: `translate(-50%, -50%) rotate(${element.rotation}deg) scale(${element.scale})`,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <img
        src={element.src}
        alt=""
        className={`max-w-[80px] md:max-w-[100px] pointer-events-none ${
          isSelected ? 'ring-2 ring-[#B8001F] ring-offset-2 rounded-lg' : ''
        }`}
        draggable={false}
      />
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(element.id)
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full 
                     flex items-center justify-center text-xs font-bold shadow-lg
                     hover:bg-red-600 transition-colors"
        >
          ×
        </button>
      )}
    </div>
  )
}

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
  const [bgType, setBgType] = useState(BG_TYPES.SCENE)
  const [bgCategory, setBgCategory] = useState('all')
  const [selectedBg, setSelectedBg] = useState(null) // { type, num }
  
  // Elements state
  const [elementCategory, setElementCategory] = useState('all')
  const [placedElements, setPlacedElements] = useState([])
  const [selectedElementId, setSelectedElementId] = useState(null)
  
  // Refs
  const canvasContainerRef = useRef(null)
  const exportCanvasRef = useRef(null)
  
  // Loaded images cache
  const [loadedPhotos, setLoadedPhotos] = useState([])

  // ----------------------------------------
  // DERIVED VALUES
  // ----------------------------------------
  const gridConfig = getGridConfig(layout, orientation)
  const { rows, cols } = gridConfig
  
  const isVertical = orientation?.id === 'vertical'
  const canvasAspectRatio = orientation?.width / orientation?.height

  // Get backgrounds for current category
  const availableBackgrounds = bgType === BG_TYPES.SCENE
    ? getScenesByCategory(bgCategory)
    : getPatternsByCategory(bgCategory)

  // Get elements for current category
  const availableElements = getElementsByCategory(elementCategory)

  // Get category options
  const bgCategories = bgType === BG_TYPES.SCENE
    ? { all: { name: 'All' }, ...SCENE_CATEGORIES }
    : { all: { name: 'All' }, ...PATTERN_CATEGORIES }

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
  // ELEMENT HANDLERS
  // ----------------------------------------
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const src = e.dataTransfer.getData('text/plain')
    if (!src || !canvasContainerRef.current) return

    const rect = canvasContainerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Add element only on drop - this prevents ghosting
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
  // BACKGROUND STYLE FOR PREVIEW
  // ----------------------------------------
  const getBackgroundStyle = () => {
    if (!selectedBg) {
      return { backgroundColor: '#ffffff' }
    }

    const bgPath = selectedBg.type === BG_TYPES.SCENE
      ? getScenePath(selectedBg.num)
      : getPatternPath(selectedBg.num)

    if (selectedBg.type === BG_TYPES.SCENE) {
      return {
        backgroundImage: `url(${bgPath})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    } else {
      return {
        backgroundImage: `url(${bgPath})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '256px 256px', // Tile size for patterns
      }
    }
  }

  // ----------------------------------------
  // PHOTO GRID LAYOUT CALCULATION
  // ----------------------------------------
  const getPhotoGridStyle = () => {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: '8px',
      padding: '16px',
      height: '100%',
    }
  }

  // ----------------------------------------
  // EXPORT FUNCTION - Pixel-identical to preview
  // ----------------------------------------
  const handleExport = async () => {
    if (!exportCanvasRef.current || !loadedPhotos.length) return

    const canvas = exportCanvasRef.current
    const ctx = canvas.getContext('2d')

    const canvasWidth = orientation.width
    const canvasHeight = orientation.height

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // LAYER 1: Background
    if (selectedBg) {
      const bgPath = selectedBg.type === BG_TYPES.SCENE
        ? getScenePath(selectedBg.num)
        : getPatternPath(selectedBg.num)

      try {
        const bgImg = await loadImage(bgPath)

        if (selectedBg.type === BG_TYPES.SCENE) {
          // Scene: cover behavior
          drawImageCover(ctx, bgImg, 0, 0, canvasWidth, canvasHeight)
        } else {
          // Pattern: repeat/tile
          const pattern = ctx.createPattern(bgImg, 'repeat')
          ctx.fillStyle = pattern
          ctx.fillRect(0, 0, canvasWidth, canvasHeight)
        }
      } catch (err) {
        console.error('Failed to load background:', err)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      }
    } else {
      // Default white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    }

    // LAYER 2: Photos
    const padding = Math.min(canvasWidth, canvasHeight) * 0.03
    const gap = Math.min(canvasWidth, canvasHeight) * 0.015
    const brandingHeight = 0 // No branding in editor mode

    const availableWidth = canvasWidth - (padding * 2) - (gap * (cols - 1))
    const availableHeight = canvasHeight - (padding * 2) - (gap * (rows - 1)) - brandingHeight

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

    // LAYER 3: Elements
    for (const element of placedElements) {
      try {
        const elImg = await loadImage(element.src)
        
        // Calculate position relative to canvas
        const x = (element.x / 100) * canvasWidth
        const y = (element.y / 100) * canvasHeight
        
        // Element size (scale relative to canvas)
        const baseSize = Math.min(canvasWidth, canvasHeight) * 0.12
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

    // Download
    const link = document.createElement('a')
    link.download = `snap-photo-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

    onComplete?.(canvas.toDataURL('image/png'))
  }

  // ----------------------------------------
  // SELECTED ELEMENT (for controls)
  // ----------------------------------------
  const selectedElement = placedElements.find(el => el.id === selectedElementId)

  // ----------------------------------------
  // RENDER
  // ----------------------------------------
  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-start justify-center gap-6 px-4 py-8">
      {/* Left: Canvas Preview */}
      <div className={`flex-1 max-w-2xl w-full ${isLoaded ? 'scale-in' : 'opacity-0'}`}>
        <div className="text-center mb-4">
          <h2 className="text-2xl md:text-3xl font-bold">Customize</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {layout?.name} • {orientation?.name}
          </p>
        </div>

        {/* Canvas Container */}
        <div
          ref={canvasContainerRef}
          className="relative glass rounded-2xl overflow-hidden mx-auto"
          style={{
            aspectRatio: `${orientation?.width} / ${orientation?.height}`,
            maxWidth: isVertical ? '400px' : '100%',
            maxHeight: isVertical ? '80vh' : '60vh',
            ...getBackgroundStyle(),
          }}
          onClick={deselectAll}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {/* Photo Grid - LAYER 2 */}
          <div style={getPhotoGridStyle()}>
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

          {/* Placed Elements - LAYER 3 */}
          {placedElements.map(element => (
            <PlacedElement
              key={element.id}
              element={element}
              isSelected={element.id === selectedElementId}
              onSelect={setSelectedElementId}
              onUpdate={updateElement}
              onDelete={deleteElement}
              containerRef={canvasContainerRef}
            />
          ))}
        </div>

        {/* Element Controls */}
        {selectedElement && (
          <div className="mt-4 glass rounded-xl p-4 fade-up">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">Size</span>
                <input
                  type="range"
                  min="0.3"
                  max="2"
                  step="0.1"
                  value={selectedElement.scale}
                  onChange={(e) => updateElement(selectedElement.id, { scale: parseFloat(e.target.value) })}
                  className="w-24 accent-[#B8001F]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">Rotate</span>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={selectedElement.rotation}
                  onChange={(e) => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
                  className="w-24 accent-[#B8001F]"
                />
              </div>
              <button
                onClick={() => deleteElement(selectedElement.id)}
                className="ml-auto px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Tools Panel */}
      <div className={`w-full lg:w-80 ${isLoaded ? 'fade-up delay-200' : 'opacity-0'}`}>
        <div className="glass rounded-2xl p-4">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 p-1 bg-[var(--color-surface)]/50 rounded-xl">
            <button
              onClick={() => setActiveTab(TABS.BACKGROUND)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === TABS.BACKGROUND
                  ? 'bg-white dark:bg-[var(--color-surface-elevated)] text-[#B8001F] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              Background
            </button>
            <button
              onClick={() => setActiveTab(TABS.ELEMENTS)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === TABS.ELEMENTS
                  ? 'bg-white dark:bg-[var(--color-surface-elevated)] text-[#B8001F] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              Elements
            </button>
          </div>

          {/* BACKGROUND TAB */}
          {activeTab === TABS.BACKGROUND && (
            <div className="space-y-4">
              {/* Scene vs Pattern Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setBgType(BG_TYPES.SCENE); setBgCategory('all') }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    bgType === BG_TYPES.SCENE
                      ? 'bg-[#B8001F]/10 text-[#B8001F]'
                      : 'bg-[var(--color-surface)]/50 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]'
                  }`}
                >
                  Scenes
                </button>
                <button
                  onClick={() => { setBgType(BG_TYPES.PATTERN); setBgCategory('all') }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    bgType === BG_TYPES.PATTERN
                      ? 'bg-[#B8001F]/10 text-[#B8001F]'
                      : 'bg-[var(--color-surface)]/50 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]'
                  }`}
                >
                  Patterns
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                {Object.entries(bgCategories).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setBgCategory(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      bgCategory === key
                        ? 'bg-[#B8001F]/10 text-[#B8001F]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]/50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Background Grid */}
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {/* None option */}
                <button
                  onClick={() => setSelectedBg(null)}
                  className={`relative aspect-square rounded-lg overflow-hidden transition-all duration-200 
                              bg-white border-2 border-dashed flex items-center justify-center ${
                    selectedBg === null
                      ? 'border-[#B8001F] ring-2 ring-[#B8001F] ring-offset-2'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
                  }`}
                >
                  <span className="text-xs text-[var(--color-text-muted)] font-medium">None</span>
                </button>

                {availableBackgrounds.map((num) => (
                  <BackgroundThumbnail
                    key={`${bgType}-${num}`}
                    src={bgType === BG_TYPES.SCENE ? getScenePath(num) : getPatternPath(num)}
                    type={bgType}
                    isSelected={selectedBg?.type === bgType && selectedBg?.num === num}
                    onClick={() => setSelectedBg({ type: bgType, num })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ELEMENTS TAB */}
          {activeTab === TABS.ELEMENTS && (
            <div className="space-y-4">
              <p className="text-xs text-[var(--color-text-muted)]">
                Drag elements onto your photo
              </p>

              {/* Category Filter */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                {Object.entries(elementCategories).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setElementCategory(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      elementCategory === key
                        ? 'bg-[#B8001F]/10 text-[#B8001F]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]/50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Elements Grid */}
              <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {availableElements.map((num) => (
                  <ElementThumbnail
                    key={num}
                    src={getElementPath(num)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-2">
          <button
            onClick={handleExport}
            disabled={!loadedPhotos.length}
            className="w-full py-4 rounded-xl btn-primary text-white font-bold text-lg 
                       shadow-lg hover:shadow-xl hover:shadow-[#B8001F]/20 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Download
          </button>
          <button
            onClick={onReset}
            className="w-full py-3 rounded-xl glass text-[var(--color-text-secondary)] 
                       hover:text-[var(--color-text-primary)] transition-all font-semibold"
          >
            Start Over
          </button>
        </div>
      </div>

      {/* Hidden Export Canvas */}
      <canvas ref={exportCanvasRef} className="hidden" />
    </div>
  )
}

export default Editor
