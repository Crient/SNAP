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
      <div className={`text-center mb-12 ${isLoaded ? 'fade-up' : 'opacity-0'}`}>
        {/* Animated Camera Icon */}
        <div className="relative inline-block mb-6">
          <div className="text-8xl md:text-9xl float">📸</div>
          <div className="absolute -inset-4 bg-[#B8001F]/10 rounded-full blur-2xl -z-10" />
        </div>

        {/* Title */}
        <h1 
          className="font-['Syne'] text-6xl md:text-8xl font-extrabold tracking-tight mb-4"
          style={{ 
            background: 'linear-gradient(135deg, #B8001F 0%, #FB708D 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          SNAP
        </h1>

        {/* Tagline */}
        <p 
          className={`text-lg md:text-xl text-secondary max-w-md mx-auto ${isLoaded ? 'fade-up delay-200' : 'opacity-0'}`}
        >
          Your digital photo booth experience.
          <br />
          <span className="text-[#B8001F]">Capture moments, create memories.</span>
        </p>
      </div>

      {/* Start Button */}
      <div className={`${isLoaded ? 'fade-up delay-300' : 'opacity-0'}`}>
        <button
          onClick={onStart}
          className="group relative px-12 py-5 rounded-2xl btn-primary text-white font-semibold text-xl 
                     shadow-lg overflow-hidden"
        >
          {/* Button Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                          -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          
          <span className="relative flex items-center gap-3">
            <span>Start Photo Booth</span>
            <svg 
              className="w-6 h-6 group-hover:translate-x-1 transition-transform" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
      </div>

      {/* Features Preview */}
      <div className={`mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl ${isLoaded ? 'fade-up delay-400' : 'opacity-0'}`}>
        {[
          { icon: '🎨', label: 'Fun Layouts' },
          { icon: '✨', label: 'Stickers & Text' },
          { icon: '🪄', label: 'AI Effects' },
          { icon: '📥', label: 'Easy Download' },
        ].map((feature, i) => (
          <div 
            key={feature.label}
            className="glass rounded-2xl p-4 text-center hover:bg-[var(--color-surface)] transition-colors cursor-default"
            style={{ animationDelay: `${400 + i * 100}ms` }}
          >
            <div className="text-3xl mb-2">{feature.icon}</div>
            <div className="text-sm text-secondary">{feature.label}</div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <p className={`mt-12 text-sm text-muted ${isLoaded ? 'fade-up delay-500' : 'opacity-0'}`}>
        Works entirely in your browser • No uploads • Your photos stay private
      </p>
    </div>
  )
}

export default Landing
