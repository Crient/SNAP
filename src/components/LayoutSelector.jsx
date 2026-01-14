import { useState, useEffect } from 'react'

function LayoutSelector({ layouts, onSelect, onBack }) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Visual preview of each layout
  const renderLayoutPreview = (layout) => {
    const grid = layout.gridByOrientation?.vertical || layout.grid
    
    const gridStyle = {
      display: 'grid',
      gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
      gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
      gap: '3px',
    }

    const cells = Array(layout.shots).fill(null)

    return (
      <div className="w-full aspect-[3/4] bg-[var(--color-surface)] rounded-lg p-2 flex flex-col">
        <div className="flex-1" style={gridStyle}>
          {cells.map((_, i) => (
            <div 
              key={i}
              className="bg-gradient-to-br from-[#B8001F]/30 to-[#FB708D]/30 rounded-sm"
            />
          ))}
        </div>
        {grid.captionSpace && (
          <div className="h-4 mt-1 bg-[var(--color-border)] rounded-sm flex items-center justify-center">
            <span className="text-[8px] text-muted">caption</span>
          </div>
        )}
      </div>
    )
  }

  const getOrientationInfo = (layout) => {
    if (layout.allowedOrientations.length === 2) {
      return { text: 'Both orientations', color: 'bg-green-500/20 text-green-600 dark:text-green-400' }
    } else if (layout.allowedOrientations.includes('horizontal')) {
      return { text: 'Horizontal only', color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400' }
    } else {
      return { text: 'Vertical only', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' }
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className={`text-center mb-10 ${isLoaded ? 'fade-up' : 'opacity-0'}`}>
        <h2 className="font-['Syne'] text-4xl md:text-5xl font-bold mb-3">
          Choose Your Layout
        </h2>
        <p className="text-secondary">
          Pick how your photos will be arranged
        </p>
      </div>

      {/* Layout Options */}
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full ${isLoaded ? 'fade-up delay-200' : 'opacity-0'}`}>
        {layouts.map((layout, index) => {
          const orientationInfo = getOrientationInfo(layout)
          
          return (
            <button
              key={layout.id}
              onClick={() => onSelect(layout)}
              className="group glass rounded-2xl p-5 hover:bg-[var(--color-surface)] transition-all duration-300 
                         hover:scale-[1.02] hover:shadow-lg"
              style={{ animationDelay: `${200 + index * 80}ms` }}
            >
              {/* Layout Preview */}
              <div className="mb-3 group-hover:scale-95 transition-transform duration-300">
                {renderLayoutPreview(layout)}
              </div>

              {/* Layout Info */}
              <div className="text-2xl mb-1">{layout.icon}</div>
              <h3 className="font-semibold text-base mb-0.5">{layout.name}</h3>
              <p className="text-xs text-secondary mb-2">{layout.shots} photos</p>
              
              {/* Orientation Badge */}
              <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${orientationInfo.color}`}>
                {orientationInfo.text}
              </span>
            </button>
          )
        })}
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className={`mt-10 flex items-center gap-2 text-secondary hover:text-primary transition-colors ${isLoaded ? 'fade-up delay-400' : 'opacity-0'}`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
    </div>
  )
}

export default LayoutSelector
