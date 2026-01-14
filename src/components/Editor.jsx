import { useState, useRef, useEffect, useCallback } from 'react'

// Available stickers
const STICKERS = [
  '😊', '😍', '🥳', '😎', '🤩', '😜', '🥰', '😇',
  '❤️', '💕', '💖', '✨', '⭐', '🌟', '💫', '🎉',
  '🎈', '🎊', '🦋', '🌸', '🌺', '🌈', '☀️', '🌙',
  '👑', '💎', '🔥', '💯', '🎀', '🍀', '🌻', '🍭',
]

// Editor tabs
const TABS = {
  STICKERS: 'stickers',
  TEXT: 'text',
  BORDER: 'border',
}

// Theme-based border presets
const BORDER_THEMES = [
  {
    id: 'none',
    name: 'None',
    preview: 'bg-transparent border border-[var(--color-border)]',
    padding: 0,
    background: null,
    radius: 0,
    shadow: 'none',
  },
  {
    id: 'clean',
    name: 'Clean',
    preview: 'bg-white',
    padding: 36,
    background: '#ffffff',
    radius: 0,
    shadow: 'none',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    preview: 'bg-[#fafafa] rounded-lg shadow-sm',
    padding: 28,
    background: '#fafafa',
    radius: 12,
    shadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  {
    id: 'glass',
    name: 'Glass',
    preview: 'bg-gradient-to-br from-white/90 to-blue-50/80 rounded-xl shadow-lg',
    padding: 32,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,248,255,0.9) 100%)',
    radius: 16,
    shadow: '0 8px 32px rgba(0,0,0,0.1)',
  },
  {
    id: 'brand',
    name: 'Brand',
    preview: 'bg-gradient-to-br from-[#B8001F]/10 to-[#FB708D]/10 rounded-xl',
    padding: 36,
    background: 'linear-gradient(135deg, #fff5f5 0%, #fff0f3 100%)',
    radius: 16,
    shadow: '0 4px 20px rgba(184,0,31,0.1)',
  },
  {
    id: 'dark',
    name: 'Dark',
    preview: 'bg-[#0B0E14] rounded-xl shadow-xl',
    padding: 32,
    background: '#0B0E14',
    radius: 16,
    shadow: '0 8px 32px rgba(0,0,0,0.3)',
    dark: true,
  },
]

function Editor({ image, onComplete, onReset }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState(TABS.BORDER)
  const [overlays, setOverlays] = useState([])
  const [selectedOverlay, setSelectedOverlay] = useState(null)
  const [textInput, setTextInput] = useState('')
  const containerRef = useRef(null)

  const [selectedTheme, setSelectedTheme] = useState(BORDER_THEMES[1])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const addSticker = (emoji) => {
    const newOverlay = {
      id: Date.now(),
      type: 'sticker',
      content: emoji,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
    }
    setOverlays(prev => [...prev, newOverlay])
    setSelectedOverlay(newOverlay.id)
  }

  const addText = () => {
    if (!textInput.trim()) return
    const newOverlay = {
      id: Date.now(),
      type: 'text',
      content: textInput,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      color: '#B8001F',
    }
    setOverlays(prev => [...prev, newOverlay])
    setSelectedOverlay(newOverlay.id)
    setTextInput('')
  }

  const updateOverlay = (id, updates) => {
    setOverlays(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o))
  }

  const deleteSelected = () => {
    if (selectedOverlay) {
      setOverlays(prev => prev.filter(o => o.id !== selectedOverlay))
      setSelectedOverlay(null)
    }
  }

  const handleDrag = useCallback((e, overlayId) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    
    const onMove = (moveEvent) => {
      const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX
      const clientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY
      
      const x = ((clientX - rect.left) / rect.width) * 100
      const y = ((clientY - rect.top) / rect.height) * 100
      
      updateOverlay(overlayId, {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      })
    }

    const onEnd = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onEnd)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onEnd)
    document.addEventListener('touchmove', onMove)
    document.addEventListener('touchend', onEnd)
  }, [])

  const exportImage = async () => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    await new Promise((resolve) => {
      img.onload = resolve
      img.src = image
    })

    const theme = selectedTheme
    const border = theme.padding
    const canvasWidth = img.width + (border * 2)
    const canvasHeight = img.height + (border * 2)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    if (theme.background) {
      if (theme.background.startsWith('linear-gradient')) {
        const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight)
        if (theme.id === 'glass') {
          gradient.addColorStop(0, 'rgba(255,255,255,0.95)')
          gradient.addColorStop(1, 'rgba(240,248,255,0.9)')
        } else if (theme.id === 'brand') {
          gradient.addColorStop(0, '#fff5f5')
          gradient.addColorStop(1, '#fff0f3')
        }
        ctx.fillStyle = gradient
      } else {
        ctx.fillStyle = theme.background
      }
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    }

    if (theme.shadow !== 'none' && border > 0) {
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
      ctx.shadowBlur = border * 0.3
      ctx.shadowOffsetY = border * 0.1
      ctx.fillStyle = '#ffffff'
      if (theme.radius > 0) {
        roundRect(ctx, border, border, img.width, img.height, theme.radius * 0.5)
        ctx.fill()
      } else {
        ctx.fillRect(border, border, img.width, img.height)
      }
      ctx.restore()
    }

    if (theme.radius > 0 && border > 0) {
      ctx.save()
      roundRect(ctx, border, border, img.width, img.height, theme.radius * 0.5)
      ctx.clip()
      ctx.drawImage(img, border, border)
      ctx.restore()
    } else {
      ctx.drawImage(img, border, border)
    }

    for (const overlay of overlays) {
      const x = border + (overlay.x / 100) * img.width
      const y = border + (overlay.y / 100) * img.height
      
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate((overlay.rotation * Math.PI) / 180)
      ctx.scale(overlay.scale, overlay.scale)

      if (overlay.type === 'sticker') {
        ctx.font = '80px serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(overlay.content, 0, 0)
      } else if (overlay.type === 'text') {
        ctx.font = 'bold 48px Outfit, sans-serif'
        ctx.fillStyle = overlay.color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'
        ctx.lineWidth = 4
        ctx.strokeText(overlay.content, 0, 0)
        ctx.fillText(overlay.content, 0, 0)
      }
      
      ctx.restore()
    }

    const link = document.createElement('a')
    link.download = `snap-photo-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

    onComplete(canvas.toDataURL('image/png'))
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  const selected = overlays.find(o => o.id === selectedOverlay)

  const getPreviewBorderStyle = () => {
    if (selectedTheme.padding === 0) return {}
    
    const scaledPadding = Math.max(6, selectedTheme.padding / 3)
    
    return {
      padding: `${scaledPadding}px`,
      background: selectedTheme.background || 'transparent',
      borderRadius: selectedTheme.radius > 0 ? `${selectedTheme.radius / 2}px` : '0',
      boxShadow: selectedTheme.shadow !== 'none' ? selectedTheme.shadow : 'none',
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 px-4 py-8">
      {/* Preview Area */}
      <div className={`flex-1 max-w-2xl ${isLoaded ? 'scale-in' : 'opacity-0'}`}>
        <div className="text-center mb-4">
          <h2 className="font-['Syne'] text-2xl md:text-3xl font-bold">
            Customize ✨
          </h2>
        </div>

        <div 
          ref={containerRef}
          className="relative glass rounded-2xl p-3 cursor-pointer"
          onClick={() => setSelectedOverlay(null)}
        >
          <div 
            className="inline-block transition-all duration-300"
            style={getPreviewBorderStyle()}
          >
            <img 
              src={image} 
              alt="Your photo" 
              className="max-w-full block"
              style={{ 
                borderRadius: selectedTheme.radius > 0 ? `${selectedTheme.radius / 3}px` : '0' 
              }}
              draggable={false}
            />
          </div>

          {overlays.map(overlay => (
            <div
              key={overlay.id}
              className={`absolute cursor-move select-none transition-shadow ${
                selectedOverlay === overlay.id ? 'ring-2 ring-[#B8001F] ring-offset-2 rounded-lg' : ''
              }`}
              style={{
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
                transform: `translate(-50%, -50%) rotate(${overlay.rotation}deg) scale(${overlay.scale})`,
              }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedOverlay(overlay.id)
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                setSelectedOverlay(overlay.id)
                handleDrag(e, overlay.id)
              }}
              onTouchStart={(e) => {
                e.stopPropagation()
                setSelectedOverlay(overlay.id)
                handleDrag(e, overlay.id)
              }}
            >
              {overlay.type === 'sticker' && (
                <span className="text-4xl md:text-5xl">{overlay.content}</span>
              )}
              {overlay.type === 'text' && (
                <span 
                  className="text-xl md:text-2xl font-bold whitespace-nowrap px-2"
                  style={{ 
                    color: overlay.color,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  {overlay.content}
                </span>
              )}
            </div>
          ))}
        </div>

        {selected && (
          <div className="mt-4 glass rounded-xl p-4 fade-up">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-secondary">Size</span>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={selected.scale}
                  onChange={(e) => updateOverlay(selected.id, { scale: parseFloat(e.target.value) })}
                  className="w-20 accent-[#B8001F]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-secondary">Rotate</span>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={selected.rotation}
                  onChange={(e) => updateOverlay(selected.id, { rotation: parseInt(e.target.value) })}
                  className="w-20 accent-[#B8001F]"
                />
              </div>
              {selected.type === 'text' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-secondary">Color</span>
                  <input
                    type="color"
                    value={selected.color}
                    onChange={(e) => updateOverlay(selected.id, { color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
              )}
              <button
                onClick={deleteSelected}
                className="ml-auto px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tools Panel */}
      <div className={`w-full lg:w-72 ${isLoaded ? 'fade-up delay-200' : 'opacity-0'}`}>
        <div className="glass rounded-2xl p-4">
          {/* Tabs */}
          <div className="flex gap-1 mb-4">
            {[
              { id: TABS.BORDER, icon: '🖼️', label: 'Border' },
              { id: TABS.STICKERS, icon: '😊', label: 'Stickers' },
              { id: TABS.TEXT, icon: '✏️', label: 'Text' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-[#B8001F]/10 text-[#B8001F]' 
                    : 'text-secondary hover:text-primary hover:bg-[var(--color-surface)]'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Stickers */}
          {activeTab === TABS.STICKERS && (
            <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {STICKERS.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => addSticker(emoji)}
                  className="text-2xl p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Text */}
          {activeTab === TABS.TEXT && (
            <div className="space-y-3">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your text..."
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]
                           focus:outline-none focus:border-[#B8001F] transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && addText()}
              />
              <button
                onClick={addText}
                disabled={!textInput.trim()}
                className="w-full py-3 rounded-lg bg-[#B8001F]/10 text-[#B8001F] hover:bg-[#B8001F]/20 
                           transition-colors disabled:opacity-50 font-medium"
              >
                Add Text
              </button>
            </div>
          )}

          {/* Border Themes */}
          {activeTab === TABS.BORDER && (
            <div className="grid grid-cols-2 gap-2">
              {BORDER_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`relative p-2.5 rounded-lg transition-all ${
                    selectedTheme.id === theme.id 
                      ? 'ring-2 ring-[#B8001F] bg-[var(--color-surface)]' 
                      : 'hover:bg-[var(--color-surface)]'
                  }`}
                >
                  <div 
                    className={`w-full aspect-[3/4] rounded mb-1.5 ${theme.preview}`}
                  >
                    <div className="w-[65%] h-[65%] mx-auto mt-[17.5%] bg-gradient-to-br from-[#B8001F]/30 to-[#FB708D]/30 rounded-sm" />
                  </div>
                  <span className="text-[10px] font-medium">{theme.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-2">
          <button
            onClick={exportImage}
            className="w-full py-4 rounded-xl btn-primary text-white font-semibold text-lg"
          >
            📥 Download
          </button>
          <button
            onClick={onReset}
            className="w-full py-3 rounded-xl glass text-secondary hover:text-primary transition-colors"
          >
            🔄 Start Over
          </button>
        </div>
      </div>
    </div>
  )
}

export default Editor
