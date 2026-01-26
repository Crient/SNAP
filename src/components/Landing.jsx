import { useEffect } from 'react'

function Landing({ onStart }) {
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (typeof window !== 'undefined' && window.__snapHideBoot) {
        window.__snapHideBoot()
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 md:py-12">
      {/* Logo and Title - 30% bigger on mobile */}
      <div className="text-center mb-6 md:mb-8 fade-up">
        {/* Animated Camera Icon - bigger on mobile */}
        <div className="relative inline-block mb-4 md:mb-6">
          <div className="text-[5rem] md:text-8xl lg:text-9xl float">📸</div>
          <div className="absolute -inset-4 bg-[#B8001F]/10 rounded-full blur-2xl -z-10" />
        </div>

        {/* Title - SNAP - pulled up closer to camera on mobile */}
        <h1 
          className="font-['Syne'] text-[4rem] md:text-7xl lg:text-8xl font-extrabold tracking-tight -mt-16 md:mt-0"
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
      <div className="flex flex-col items-center gap-6 md:gap-8">
        {/* Tagline + CTA group */}
        <div className="flex flex-col items-center gap-5 md:gap-6">
          {/* Tagline - 2px smaller on mobile */}
          <p 
            className="text-[14px] md:text-lg lg:text-xl max-w-md mx-auto font-semibold text-[var(--color-text-secondary)] leading-relaxed text-center fade-up delay-200"
          >
            Your digital photobooth.
            <br />
            <span className="font-bold text-[#B8001F]">Pick a layout, decorate, save.</span>
          </p>

          {/* Start Button */}
          <div className="fade-up delay-300">
            <button
              onClick={onStart}
              className="group relative rounded-2xl btn-primary text-white font-bold text-lg md:text-xl shadow-lg overflow-hidden"
              style={{ padding: '0.75rem 1.75rem' }}
            >
              {/* Button Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                              -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              
              <span className="relative flex items-center gap-2 md:gap-3">
                <span>Start Photo Booth</span>
                <svg 
                  className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" 
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

        {/* Features Preview - Always 4 columns in a single row */}
        <div className="grid grid-cols-4 gap-2 md:gap-3 w-full max-w-md md:max-w-xl fade-up delay-400">
          {[
            { icon: '🎨', label: 'Pick Layout' },
            { icon: '✨', label: 'Add Stickers' },
            { icon: '🪄', label: 'Apply Effects' },
            { icon: '📥', label: 'Export and Save' },
          ].map((feature, i) => (
            <div 
              key={feature.label}
              className="rounded-lg md:rounded-xl flex flex-col items-center justify-center gap-1 md:gap-1.5 transition-colors cursor-default"
              style={{ 
                padding: '0.5rem 0.25rem',
                animationDelay: `${400 + i * 100}ms`,
                background: 'rgba(255, 255, 255, 0.45)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="text-base md:text-xl">{feature.icon}</div>
              <div className="feature-chip-label text-[8px] md:text-xs font-semibold">{feature.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Landing
