import { useState, useEffect } from 'react'

function OrientationSelector({ orientations, selectedLayout, onSelect, onBack }) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const getGridForOrientation = (orientationId) => {
    if (selectedLayout.gridByOrientation) {
      return selectedLayout.gridByOrientation[orientationId]
    }
    return selectedLayout.grid
  }

  // For 3x1 layout, icons are swapped (vertical = computer, horizontal = phone)
  const getOrientationIcon = (orientation) => {
    if (selectedLayout.id === 'grid-3x1') {
      return orientation.id === 'vertical' ? '🖥️' : '📱'
    }
    return orientation.icon
  }

  const renderOrientationPreview = (orientation) => {
    const isVertical = orientation.id === 'vertical'
    const grid = getGridForOrientation(orientation.id)
    
    // Bigger previews on mobile
    const containerClass = isVertical 
      ? 'w-12 h-20 md:w-16 md:h-28'
      : 'w-20 h-12 md:w-28 md:h-16'

    const gridStyle = {
      display: 'grid',
      gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
      gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
      gap: '2px',
    }

    const cells = Array(selectedLayout.shots).fill(null)

    return (
      <div className={`${containerClass} rounded-md md:rounded-lg p-1 md:p-1.5 mx-auto flex flex-col`}>
        <div className="flex-1 rounded" style={gridStyle}>
          {cells.map((_, i) => (
            <div 
              key={i}
              className="bg-gradient-to-br from-[#B8001F]/35 to-[#FB708D]/35 dark:from-[#B8001F]/40 dark:to-[#FB708D]/40 rounded-sm"
            />
          ))}
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
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-3">
          Choose Orientation
        </h2>
        <p className="text-[var(--color-text-secondary)] font-semibold text-sm md:text-base">
          {selectedLayout.name} • {selectedLayout.shots} photos
        </p>
      </div>

      {/* Orientation Options - Always 2 columns */}
      <div className={`grid grid-cols-2 gap-3 md:gap-6 w-full max-w-sm md:max-w-xl ${isLoaded ? 'fade-up delay-200' : 'opacity-0'}`}>
        {orientations.map((orientation, index) => {
          const grid = getGridForOrientation(orientation.id)
          
          return (
            <button
              key={orientation.id}
              onClick={() => onSelect(orientation)}
              className="group relative text-center p-4 md:p-5 pb-[calc(1rem+2px)] md:pb-[calc(1.25rem+2px)] rounded-2xl md:rounded-3xl
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
              <div className="relative z-10">
                {/* Orientation Preview */}
                <div className="mb-3 md:mb-4 h-24 md:h-36 flex items-center justify-center group-hover:scale-95 transition-transform duration-300">
                  {renderOrientationPreview(orientation)}
                </div>

                {/* Orientation Info */}
                <div className="text-xl md:text-3xl mb-1 md:mb-2">{getOrientationIcon(orientation)}</div>
                <h3 className="font-bold text-sm md:text-lg mb-0.5 md:mb-1">{orientation.name}</h3>
                <p className="text-[10px] md:text-sm text-[var(--color-text-secondary)] font-medium">{orientation.description}</p>
                
                <span className="orientation-grid-label inline-block mt-2 md:mt-3 text-[9px] md:text-xs text-[var(--color-brand-primary)] font-semibold">
                  {grid.cols} × {grid.rows} grid
                </span>
              </div>
            </button>
          )
        })}
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
        Back to Layouts
      </button>
    </div>
  )
}

export default OrientationSelector
