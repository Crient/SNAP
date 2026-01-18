import { useState, useEffect } from 'react'

// Grid icons - clean, minimal style
const GridIcon = ({ rows, cols, size = 28 }) => {
  const gap = 3
  const cellWidth = (size - gap * (cols - 1)) / cols
  const cellHeight = (size - gap * (rows - 1)) / rows
  
  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={c * (cellWidth + gap)}
          y={r * (cellHeight + gap)}
          width={cellWidth}
          height={cellHeight}
          rx={2.5}
          fill="currentColor"
          opacity={0.85}
        />
      )
    }
  }
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="inline-block">
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
      display: 'grid',
      gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
      gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
      gap: '4px',
    }

    const cells = Array(layout.shots).fill(null)

    return (
      <div 
        className="w-full aspect-[3/4] rounded-xl md:rounded-2xl 
                   bg-gradient-to-br from-white/50 to-white/30 
                   dark:from-white/[0.1] dark:to-white/[0.05]
                   ring-1 ring-black/[0.04] dark:ring-white/[0.1]
                   shadow-inner"
        style={{ padding: '8px' }}
      >
        <div className="w-full h-full flex flex-col">
          <div className="flex-1" style={gridStyle}>
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
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 tracking-tight">
          Choose Your Layout
        </h2>
        <p className="text-[var(--color-text-secondary)] text-sm md:text-lg font-semibold">
          Pick how your photos will be arranged
        </p>
      </div>

      {/* Layout Options - Always 3 columns */}
      <div className={`grid grid-cols-3 gap-3 md:gap-6 w-full max-w-sm md:max-w-4xl ${isLoaded ? 'fade-up delay-200' : 'opacity-0'}`}>
        {layouts.map((layout, index) => (
          <button
            key={layout.id}
            onClick={() => onSelect(layout)}
            className="group relative text-center p-3 md:p-5 rounded-2xl md:rounded-3xl
                       bg-white/40 dark:bg-white/[0.08]
                       backdrop-blur-xl backdrop-saturate-150
                       border border-white/50 dark:border-white/10
                       shadow-[0_4px_30px_rgba(0,0,0,0.05)]
                       hover:scale-[1.02] hover:-translate-y-1
                       hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]
                       hover:bg-white/50 dark:hover:bg-white/[0.12]
                       active:scale-[0.98]
                       transition-all duration-300 ease-out"
            style={{ animationDelay: `${200 + index * 100}ms` }}
          >
            {/* Sheen overlay */}
            <div className="absolute inset-0 rounded-xl md:rounded-3xl overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/0 to-transparent dark:from-white/20 dark:via-transparent" />
            </div>
            
            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Layout Preview */}
              <div>
                {renderLayoutPreview(layout)}
              </div>

              {/* Footer - Icon, Title, Photo count */}
              <div className="pt-2 md:pt-5 pb-1 md:pb-3 flex flex-col items-center justify-center gap-1 md:gap-2.5">
                {/* Icon + Name row */}
                <div className="flex items-center justify-center gap-1 md:gap-2.5">
                  <span className="text-[var(--color-text-primary)] opacity-60 hidden md:inline">
                    <GridIcon {...getIconGrid(layout)} size={20} />
                  </span>
                  <span className="text-[var(--color-text-primary)] opacity-60 md:hidden">
                    <GridIcon {...getIconGrid(layout)} size={14} />
                  </span>
                  <h3 className="font-bold text-[10px] md:text-base tracking-tight">{layout.name}</h3>
                </div>
                
                {/* Photo count */}
                <span className="text-[9px] md:text-sm font-semibold text-[var(--color-brand-primary)]">
                  {layout.shots} photos
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className={`flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full
                    text-[var(--color-text-secondary)] font-semibold text-sm md:text-base
                    hover:text-[var(--color-brand-primary)]
                    hover:bg-[var(--color-brand-primary)]/10
                    transition-all duration-200
                    ${isLoaded ? 'fade-up delay-400' : 'opacity-0'}`}
        style={{ marginTop: '22px' }}
      >
        <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back</span>
      </button>
    </div>
  )
}

export default LayoutSelector
