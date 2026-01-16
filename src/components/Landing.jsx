import { useState, useEffect } from 'react'

function Landing({ onStart }) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Logo and Title */}
      <div className={`text-center mb-8 ${isLoaded ? 'fade-up' : 'opacity-0'}`}>
        {/* Animated Camera Icon */}
        <div className="relative inline-block mb-6">
          <div className="text-8xl md:text-9xl float">📸</div>
          <div className="absolute -inset-4 bg-[#B8001F]/10 rounded-full blur-2xl -z-10" />
        </div>

        {/* Title - SNAP stays Syne */}
        <h1 
          className="font-['Syne'] text-6xl md:text-8xl font-extrabold tracking-tight"
          style={{ 
            background: 'linear-gradient(135deg, #B8001F 0%, #FB708D 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          SNAP
        </h1>
      </div>

      {/* Tagline + CTA + Features - unified flex column with balanced spacing */}
      <div className="flex flex-col items-center gap-8">
        {/* Tagline + CTA group */}
        <div className="flex flex-col items-center gap-6">
          {/* Tagline */}
        <p 
            className={`text-lg md:text-xl max-w-md mx-auto font-semibold text-[var(--color-text-secondary)] leading-relaxed text-center ${isLoaded ? 'fade-up delay-200' : 'opacity-0'}`}
        >
          Your digital photo booth experience.
          <br />
          <span className="font-bold text-[#B8001F]">Capture moments, create memories.</span>
        </p>

          {/* Start Button */}
          <div className={`${isLoaded ? 'fade-up delay-300' : 'opacity-0'}`}>
        <button
          onClick={onStart}
              className="group relative rounded-2xl btn-primary text-white font-bold text-xl shadow-lg overflow-hidden"
              style={{ padding: '0.875rem 2rem' }}
        >
          {/* Button Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                          -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          
              <span className="relative flex items-center gap-3">
            <span>Start Photo Booth</span>
            <svg 
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
          </div>
      </div>

        {/* Features Preview - softened glass, reduced visual weight */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl w-full ${isLoaded ? 'fade-up delay-400' : 'opacity-0'}`}>
        {[
          { icon: '🎨', label: 'Fun Layouts' },
          { icon: '✨', label: 'Stickers & Text' },
          { icon: '🪄', label: 'AI Effects' },
          { icon: '📥', label: 'Easy Download' },
        ].map((feature, i) => (
          <div 
            key={feature.label}
              className="rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors cursor-default"
              style={{ 
                padding: '0.75rem 0.875rem',
                animationDelay: `${400 + i * 100}ms`,
                background: 'rgba(255, 255, 255, 0.45)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
          >
              <div className="text-xl">{feature.icon}</div>
              <div className="text-xs font-semibold text-[var(--color-text-secondary)]">{feature.label}</div>
          </div>
        ))}
        </div>
      </div>
    </div>
  )
}

export default Landing
