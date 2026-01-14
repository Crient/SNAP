import { useTheme } from '../hooks/useTheme.jsx'

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <>
      {/* Keyframe animations */}
      <style>{`
        @keyframes blob-move {
          0%   { transform: scale(1) translate(0, 0); }
          50%  { transform: scale(1.3) translate(8px, 4px); }
          100% { transform: scale(1.1) translate(-4px, -2px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes float-cloud {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-2px); }
        }
        @keyframes sun-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 8px rgba(250, 204, 21, 0.6); }
          50% { transform: scale(1.1); box-shadow: 0 0 16px rgba(250, 204, 21, 0.9); }
        }
        .blob-1 { animation: blob-move 2.5s ease-in-out infinite alternate; }
        .blob-2 { animation: blob-move 2.5s ease-in-out infinite alternate 0.2s; }
        .blob-3 { animation: blob-move 2.5s ease-in-out infinite alternate 0.4s; }
        .blob-4 { animation: blob-move 2.5s ease-in-out infinite alternate 0.6s; }
        .twinkle-1 { animation: twinkle 0.7s ease-in-out infinite; }
        .twinkle-2 { animation: twinkle 0.5s ease-in-out infinite 0.15s; }
        .twinkle-3 { animation: twinkle 0.8s ease-in-out infinite 0.3s; }
        .float-cloud-1 { animation: float-cloud 1.5s ease-in-out infinite; }
        .float-cloud-2 { animation: float-cloud 2s ease-in-out infinite 0.3s; }
        .sun-glow { animation: sun-pulse 1.2s ease-in-out infinite; }
      `}</style>
      
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 outline-none rounded-full"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <div className="relative w-16 h-8 rounded-full overflow-hidden">
          
          {/* === DARK MODE BACKGROUND === */}
          <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
            {/* Layer 1: Base */}
            <div className="absolute inset-0 bg-slate-900 rounded-full" />
            {/* Layer 2: Blue blob */}
            <div className="blob-1 absolute w-10 h-10 rounded-full bg-blue-600 -top-2 -right-2" />
            {/* Layer 3: Deep blue blob */}
            <div className="blob-2 absolute w-8 h-8 rounded-full bg-blue-800 -bottom-1 -left-1" />
            {/* Layer 4: Cyan accent */}
            <div className="blob-3 absolute w-6 h-6 rounded-full bg-cyan-600 top-1 left-3" />
            {/* Layer 5: Indigo pop */}
            <div className="blob-4 absolute w-5 h-5 rounded-full bg-indigo-500 bottom-0 right-3" />
            {/* Blur overlay */}
            <div className="absolute inset-0 backdrop-blur-[12px] rounded-full" />
            
            {/* Stars */}
            <span className="absolute top-1.5 left-1.5 w-1 h-1 bg-white rounded-full twinkle-1 z-10" />
            <span className="absolute top-4 left-3 w-1.5 h-1.5 bg-white rounded-full twinkle-2 z-10" />
            <span className="absolute top-2 left-5 w-1 h-1 bg-white rounded-full twinkle-3 z-10" />
            <span className="absolute top-5 left-2 w-0.5 h-0.5 bg-white rounded-full twinkle-1 z-10" />
          </div>

          {/* === LIGHT MODE BACKGROUND === */}
          <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
            {/* Layer 1: Base warm sky */}
            <div className="absolute inset-0 bg-amber-200 rounded-full" />
            {/* Layer 2: Orange glow */}
            <div className="blob-1 absolute w-12 h-12 rounded-full bg-orange-400 -top-4 -left-4" />
            {/* Layer 3: Yellow blob */}
            <div className="blob-2 absolute w-10 h-10 rounded-full bg-yellow-400 -bottom-2 -right-2" />
            {/* Layer 4: Peach accent */}
            <div className="blob-3 absolute w-6 h-6 rounded-full bg-orange-300 top-0 left-2" />
            {/* Layer 5: Light yellow pop */}
            <div className="blob-4 absolute w-5 h-5 rounded-full bg-yellow-300 bottom-0 right-4" />
            {/* Blur overlay */}
            <div className="absolute inset-0 backdrop-blur-[12px] rounded-full" />
            
            {/* Clouds */}
            <div className="absolute bottom-0.5 right-1 flex float-cloud-1 z-10">
              <div className="w-3 h-2 bg-white/90 rounded-full" />
              <div className="w-2 h-1.5 bg-white/90 rounded-full -ml-1 mt-0.5" />
            </div>
            <div className="absolute bottom-2 right-5 float-cloud-2 z-10">
              <div className="w-2 h-1.5 bg-white/70 rounded-full" />
            </div>
          </div>

          {/* === TOGGLE KNOB === */}
          <div className={`
            absolute top-1 w-6 h-6 rounded-full shadow-lg z-20
            transition-all duration-500 ease-in-out
            ${isDark ? 'left-9' : 'left-1'}
          `}>
            {isDark ? (
              // Moon
              <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-100 to-slate-300 relative overflow-hidden">
                <div className="absolute top-1 left-1.5 w-1.5 h-1.5 bg-slate-400/40 rounded-full" />
                <div className="absolute top-3 left-3 w-1 h-1 bg-slate-400/30 rounded-full" />
              </div>
            ) : (
              // Sun
              <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 sun-glow flex items-center justify-center">
                <div className="w-3 h-3 bg-yellow-200/80 rounded-full" />
              </div>
            )}
          </div>
        </div>
      </button>
    </>
  )
}

export default ThemeToggle
