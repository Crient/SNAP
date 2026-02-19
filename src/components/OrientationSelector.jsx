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

  const getOrientationIconSrc = (orientationId) => {
    return orientationId === 'vertical'
      ? '/assets/OrientationSelectorPhone.png'
      : '/assets/OrientationSelectorComputer.png'
  }

  const renderOrientationPreview = (orientation) => {
    const isVertical = orientation.id === 'vertical'
    const grid = getGridForOrientation(orientation.id)
    
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
        <p className="text-[var(--color-text-secondary)] font-semibold text-sm md:text-base"
        style={{ marginBottom: '10px' }}
>
          {selectedLayout.name} • {selectedLayout.shots} photos
        </p>
      </div>

      {/* Orientation Options - Always 2 columns */}
      <div className={`grid grid-cols-2 gap-3 md:gap-6 w-full max-w-sm md:max-w-xl ${isLoaded ? 'fade-up delay-200' : 'opacity-0'}`}>
        {orientations.map((orientation, index) => {
          return (
            <button
              key={orientation.id}
              onClick={() => onSelect(orientation)}
              className="layout-glass-card group relative text-center p-4 md:p-5 rounded-2xl md:rounded-3xl
                         hover:scale-[1.015] hover:-translate-y-1
                         active:scale-[0.985]
                         transition-all duration-300 ease-out"
              style={{ animationDelay: `${200 + index * 100}ms` }}
            >
              <div className="layout-glass-card-sheen absolute inset-0 rounded-2xl md:rounded-3xl pointer-events-none" />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center">
                {/* Orientation Preview */}
                <div className="mb-3 md:mb-4 h-24 md:h-36 flex items-center justify-center group-hover:scale-95 transition-transform duration-300">
                  {renderOrientationPreview(orientation)}
                </div>

                {/* Orientation Info */}
                <img
                  src={getOrientationIconSrc(orientation.id)}
                  alt={`${orientation.name} icon`}
                  className="w-6 h-6 md:w-8 md:h-8 mb-1.5 md:mb-2 object-contain"
                  draggable={false}
                />
                <h3 className="font-bold text-sm md:text-lg mb-0.5 md:mb-1">{orientation.name}</h3>

                <span
                  className="inline-flex items-center justify-center rounded-full
                             mt-2 md:mt-3 px-3 md:px-4 py-[0.34rem] md:py-1.5
                             min-h-[1.45rem] md:min-h-[1.7rem]
                             text-[10px] md:text-sm leading-none font-medium whitespace-nowrap
                             text-[var(--color-text-secondary)]
                             bg-white/25 dark:bg-white/[0.1]
                             backdrop-blur-sm
                             border border-white/45 dark:border-white/15
                             shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                              style={{ marginBottom: '20px', padding: '0.25rem 0.75rem', marginTop: '10px' }}
                >
                  {orientation.description}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className={`flex items-center gap-1.5 md:gap-2 px-[0.9rem] md:px-[1.125rem] py-[0.45rem] md:py-[0.56rem] rounded-full
                    text-[var(--color-text-secondary)] font-semibold text-[13px] md:text-[14px]
                    hover:text-[var(--color-brand-primary)]
                    hover:bg-[var(--color-brand-primary)]/10
                    transition-all duration-200
                    ${isLoaded ? 'fade-up delay-400' : 'opacity-0'}`}
        style={{ marginTop: '20px' }}
      >
        <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Layouts
      </button>
    </div>
  )
}

export default OrientationSelector
