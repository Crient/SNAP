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

  const renderOrientationPreview = (orientation) => {
    const isVertical = orientation.id === 'vertical'
    const grid = getGridForOrientation(orientation.id)
    
    const containerClass = isVertical 
      ? 'w-16 h-28'
      : 'w-28 h-16'

    const gridStyle = {
      display: 'grid',
      gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
      gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
      gap: '2px',
    }

    const cells = Array(selectedLayout.shots).fill(null)

    return (
      <div className={`${containerClass} bg-[var(--color-surface)] rounded-lg p-1.5 mx-auto flex flex-col`}>
        <div className="flex-1 rounded" style={gridStyle}>
          {cells.map((_, i) => (
            <div 
              key={i}
              className="bg-gradient-to-br from-[#B8001F]/40 to-[#FB708D]/40 rounded-sm"
            />
          ))}
        </div>
        {grid.captionSpace && (
          <div className="h-2 mt-1 bg-[var(--color-border)] rounded-sm" />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Header - Manrope 700 for title, 600 for subtitle */}
      <div className={`text-center mb-10 ${isLoaded ? 'fade-up' : 'opacity-0'}`}>
        <h2 className="text-4xl md:text-5xl font-bold mb-3">
          Choose Orientation
        </h2>
        <p className="text-[var(--color-text-secondary)] font-semibold">
          {selectedLayout.name} • {selectedLayout.shots} photos
        </p>
      </div>

      {/* Orientation Options */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl w-full ${isLoaded ? 'fade-up delay-200' : 'opacity-0'}`}>
        {orientations.map((orientation, index) => {
          const grid = getGridForOrientation(orientation.id)
          
          return (
            <button
              key={orientation.id}
              onClick={() => onSelect(orientation)}
              className="group glass rounded-3xl p-6 hover:bg-[var(--color-surface)] transition-all duration-300 
                         hover:scale-[1.02] hover:shadow-lg"
              style={{ animationDelay: `${200 + index * 100}ms` }}
            >
              {/* Orientation Preview */}
              <div className="mb-4 h-36 flex items-center justify-center group-hover:scale-95 transition-transform duration-300">
                {renderOrientationPreview(orientation)}
              </div>

              {/* Orientation Info - Manrope 700 for name, 600 for description */}
              <div className="text-3xl mb-2">{orientation.icon}</div>
              <h3 className="font-bold text-lg mb-1">{orientation.name}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-medium">{orientation.description}</p>
              
              <span className="inline-block mt-2 text-xs bg-[var(--color-surface)] px-2 py-1 rounded-full text-[var(--color-text-muted)] font-medium">
                {grid.cols} × {grid.rows} grid
              </span>
            </button>
          )
        })}
      </div>

      {/* Back Button - Manrope 600 */}
      <button
        onClick={onBack}
        className={`mt-10 flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] transition-colors font-semibold ${isLoaded ? 'fade-up delay-400' : 'opacity-0'}`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Layouts
      </button>
    </div>
  )
}

export default OrientationSelector
