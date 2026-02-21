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
        {/* Logo Image - bigger on mobile */}
        <div className="relative inline-block mb-0">
          <div className="w-[11rem] h-[9.5rem] md:w-[16rem] md:h-[13.9rem] lg:w-[18.5rem] lg:h-[16rem] overflow-hidden float">
            <img
              src="/assets/LandingPageLogo.optimized.png"
              alt="SNAP logo"
              className="block w-full h-full object-cover object-[50%_14%] [mask-image:linear-gradient(to_bottom,black_0%,black_90%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_90%,transparent_100%)]"
              width="1100"
              height="1100"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              draggable={false}
            />
          </div>
          <div className="absolute -inset-4 bg-[#B8001F]/10 rounded-full blur-2xl -z-10" />
        </div>

        {/* Title - SNAP - pulled up closer to camera on mobile */}
        <h1
          className="font-['Syne'] text-[3rem] md:text-6xl lg:text-7xl font-extrabold tracking-tight -mt-2 md:-mt-3 lg:-mt-4"
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
      <div className="flex flex-col items-center gap-5 md:gap-6">
        {/* Tagline + CTA group */}
        <div className="flex flex-col items-center gap-4 md:gap-5">
          {/* Tagline - 2px smaller on mobile */}
          <p 
            className="text-[11px] md:text-[14px] lg:text-base max-w-md mx-auto font-semibold text-[var(--color-text-secondary)] leading-relaxed text-center fade-up delay-200"
          >
            Your digital photobooth.
            <br />
            <span className="font-bold text-[#B8001F]">Pick a layout, decorate, save.</span>
          </p>

          {/* Start Button */}
          <div className="fade-up delay-300">
            <button
              onClick={onStart}
              className="group relative rounded-2xl btn-primary text-white font-bold text-[14px] md:text-base shadow-lg overflow-hidden"
              style={{ padding: '0.6rem 1.4rem' }}
            >
              {/* Button Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                              -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              
              <span className="relative flex items-center gap-1.5 md:gap-2.5">
                <span>Start Photo Booth</span>
                <svg 
                  className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" 
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
        <div className="grid grid-cols-4 gap-1.5 md:gap-2 w-full max-w-[20rem] md:max-w-[29rem] fade-up delay-400">
          {[
            { iconSrc: '/assets/LandingPagePaint.png', label: 'Pick Layout' },
            { iconSrc: '/assets/LandingPageSticker.png', label: 'Add Stickers' },
            { iconSrc: '/assets/LandingPageEffect.png', label: 'Apply Effects' },
            { iconSrc: '/assets/LandingPageExport.png', label: 'Export and Save' },
          ].map((feature, i) => (
            <div 
              key={feature.label}
              className="rounded-lg md:rounded-xl flex flex-col items-center justify-center gap-0.5 md:gap-1 transition-colors cursor-default"
              style={{ 
                padding: '0.4rem 0.2rem',
                animationDelay: `${400 + i * 100}ms`,
                background: 'rgba(255, 255, 255, 0.45)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
            >
              <img
                src={feature.iconSrc}
                alt=""
                className="w-4 h-4 md:w-5 md:h-5 object-contain"
                draggable={false}
              />
              <div className="feature-chip-label text-[7px] md:text-[10px] font-semibold">{feature.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Landing
