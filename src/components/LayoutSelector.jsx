import { useState, useEffect } from 'react'

// Grid icons - fixed geometry for crisper small-size rendering
const GridIcon = ({ rows, cols, size = 28 }) => {
  const iconSize = 24
  const padding = 2
  const gap = 2.5

  const availableW = iconSize - padding * 2 - gap * (cols - 1)
  const availableH = iconSize - padding * 2 - gap * (rows - 1)

  const baseCellW = availableW / cols
  const baseCellH = availableH / rows

  // Keep single-row/column layouts visually balanced (avoid overly long bars)
  const cellW = cols === 1 ? Math.min(baseCellW, 14) : baseCellW
  const cellH = rows === 1 ? Math.min(baseCellH, 14) : baseCellH

  const startX = (iconSize - (cellW * cols + gap * (cols - 1))) / 2
  const startY = (iconSize - (cellH * rows + gap * (rows - 1))) / 2
  const radius = Math.max(1.5, Math.min(cellW, cellH) * 0.33)

  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={startX + c * (cellW + gap)}
          y={startY + r * (cellH + gap)}
          width={cellW}
          height={cellH}
          rx={radius}
          fill="currentColor"
          opacity={0.9}
        />
      )
    }
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="inline-block align-middle" aria-hidden="true">
      {cells}
    </svg>
  )
}

function LayoutSelector({ layouts, onSelect, onBack }) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Get grid config for icon
  const getIconGrid = (layout) => {
    const grid = layout.gridByOrientation?.vertical || layout.grid
    return { rows: grid.rows, cols: grid.cols }
  }

  // Visual preview of each layout
  const renderLayoutPreview = (layout) => {
    const grid = layout.gridByOrientation?.vertical || layout.grid
    
    const gridStyle = {
      gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
      gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
    }

    const cells = Array(layout.shots).fill(null)

    return (
      <div
        className="layout-preview relative w-full aspect-[3/4] rounded-xl md:rounded-2xl overflow-hidden"
      >
        <div className="relative w-full h-full flex flex-col">
          <div className="layout-preview-grid flex-1 w-full h-full" style={gridStyle}>
            {cells.map((_, i) => (
              <div 
                key={i}
                className="bg-gradient-to-br from-[#B8001F]/35 to-[#FB708D]/35 
                           dark:from-[#B8001F]/40 dark:to-[#FB708D]/40
                           rounded-md md:rounded-lg shadow-sm"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-3 md:px-4 py-8 md:py-12">
      {/* Header */}
      <div 
        className={`text-center ${isLoaded ? 'fade-up' : 'opacity-0'}`}
        style={{ marginBottom: '10px' }}
      >
        <h2 className="text-[1.35rem] md:text-[2.05rem] lg:text-[2.7rem] font-bold mb-2 md:mb-4 tracking-tight">
          Choose Your Layout
        </h2>
        <p className="text-[var(--color-text-secondary)] text-[0.8rem] md:text-base font-semibold"
        style={{ marginBottom: '10px' }}
>
          Pick how your photos will be arranged
        </p>
      </div>

      {/* Layout Options - Always 3 columns */}
      <div className={`grid grid-cols-3 gap-[0.68rem] md:gap-[1.35rem] w-full max-w-[21.6rem] md:max-w-[50.4rem] ${isLoaded ? 'fade-up delay-200' : 'opacity-0'}`}>
        {layouts.map((layout, index) => (
          <button
            key={layout.id}
            onClick={() => onSelect(layout)}
            className="layout-glass-card group relative text-center p-[0.675rem] md:p-[1.125rem] rounded-2xl md:rounded-3xl
                       hover:scale-[1.015] hover:-translate-y-1
                       active:scale-[0.985]
                       transition-all duration-300 ease-out"
            style={{ animationDelay: `${200 + index * 100}ms` }}
          >
            <div className="layout-glass-card-sheen absolute inset-0 rounded-2xl md:rounded-3xl pointer-events-none" />
            
            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Layout Preview */}
              <div>
                {renderLayoutPreview(layout)}
              </div>

              {/* Footer - Icon, Title, Photo count */}
              <div className="pt-[0.5rem] md:pt-[1rem] pb-[0.95rem] md:pb-[1.25rem] flex flex-col items-center justify-center gap-[10px]">
                {/* Icon + Name row */}
                <div className="flex items-center justify-center gap-[0.45rem] md:gap-[0.68rem]">
                  <span className="text-[var(--color-text-primary)] opacity-60 hidden md:inline">
                    <GridIcon {...getIconGrid(layout)} size={18} />
                  </span>
                  <span className="text-[var(--color-text-primary)] opacity-60 md:hidden">
                    <GridIcon {...getIconGrid(layout)} size={13} />
                  </span>
                  <h3 className="font-bold text-[9px] md:text-[15px] tracking-tight">{layout.name}</h3>
                </div>
                
                {/* Photo count */}
                <span
                  className="inline-flex items-center justify-center rounded-full
                             px-4 py-[0.34rem] md:px-5 md:py-1.5
                             min-w-[5.25rem] md:min-w-[6rem]
                             min-h-[1.45rem] md:min-h-[1.7rem]
                             text-[9px] md:text-[11px] leading-none font-semibold whitespace-nowrap
                             text-[var(--color-text-secondary)]
                             bg-white/25 dark:bg-white/[0.1]
                             backdrop-blur-sm
                             border border-white/45 dark:border-white/15
                             shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                             style={{ marginBottom: '10px' }}
                >
                  {layout.shots} shots
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className={`flex items-center gap-1.5 md:gap-2 px-[0.9rem] md:px-[1.125rem] py-[0.45rem] md:py-[0.56rem] rounded-full
                    text-[var(--color-text-secondary)] font-semibold text-[13px] md:text-[14px]
                    hover:text-[var(--color-brand-primary)]
                    hover:
                    transition-all duration-200
                    ${isLoaded ? 'fade-up delay-400' : 'opacity-0'}`}
        style={{ marginTop: '20px' }}
      >
        <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back</span>
      </button>
    </div>
  )
}

export default LayoutSelector
