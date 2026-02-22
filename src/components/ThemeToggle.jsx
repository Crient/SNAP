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
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-1.5px) translateY(-0.6px); }
        }
        @keyframes float-cloud-slow {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(1.1px) translateY(-0.4px); }
        }
        @keyframes sun-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 8px rgba(250, 204, 21, 0.45); }
          50% { transform: scale(1.05); box-shadow: 0 0 13px rgba(250, 204, 21, 0.7); }
        }
        .blob-1 { animation: blob-move 2.5s ease-in-out infinite alternate; }
        .blob-2 { animation: blob-move 2.5s ease-in-out infinite alternate 0.2s; }
        .blob-3 { animation: blob-move 2.5s ease-in-out infinite alternate 0.4s; }
        .blob-4 { animation: blob-move 2.5s ease-in-out infinite alternate 0.6s; }
        .twinkle-1 { animation: twinkle 0.7s ease-in-out infinite; }
        .twinkle-2 { animation: twinkle 0.5s ease-in-out infinite 0.15s; }
        .twinkle-3 { animation: twinkle 0.8s ease-in-out infinite 0.3s; }
        .float-cloud-main { animation: float-cloud 1.7s ease-in-out infinite; }
        .float-cloud-back { animation: float-cloud-slow 2.3s ease-in-out infinite 0.2s; }
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
            <div className="absolute inset-0 rounded-full bg-[linear-gradient(140deg,#0f172a_0%,#1e3a8a_50%,#111827_100%)]" />
            <div className="absolute -top-4 -left-2 h-10 w-10 rounded-full bg-cyan-300/20 blur-md" />
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
            <div className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,#fef3c7_0%,#fde047_56%,#f59e0b_100%)]" />
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_22%_24%,rgba(255,255,255,0.48)_0%,rgba(255,255,255,0)_36%),radial-gradient(circle_at_75%_80%,rgba(245,158,11,0.22)_0%,rgba(245,158,11,0)_44%)]" />
            {/* Sun + glow */}
            <div className="absolute -top-2.5 -left-1.5 h-11 w-11 rounded-full bg-yellow-100/70 blur-[2.5px]" />
            <div className="absolute top-1 left-3 h-[18px] w-[18px] rounded-full bg-yellow-100/95 shadow-[0_0_10px_rgba(255,244,179,0.85)]" />
            {/* Blur overlay */}
            <div className="absolute inset-0 backdrop-blur-[10px] rounded-full" />
            
            {/* Clouds */}
            <div className="absolute top-1.5 right-[18px] h-[9px] w-[16px] float-cloud-back z-10">
              <div className="absolute bottom-0 left-[1px] h-[5px] w-[13px] rounded-full bg-white/80 shadow-[0_1px_2px_rgba(0,0,0,0.08)]" />
              <div className="absolute bottom-[2px] left-0 h-[6px] w-[6px] rounded-full bg-white/84" />
              <div className="absolute bottom-[3px] left-[5px] h-[7px] w-[7px] rounded-full bg-white/87" />
            </div>
            <div className="absolute bottom-0.5 right-0.5 h-[14px] w-[29px] float-cloud-main z-10">
              <div className="absolute bottom-0 left-[2px] h-[8px] w-[22px] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.95)_62%,rgba(226,232,240,0.94)_100%)] shadow-[0_2px_4px_rgba(0,0,0,0.14)]" />
              <div className="absolute bottom-[2px] left-0 h-[8px] w-[8px] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,249,255,0.95)_100%)]" />
              <div className="absolute bottom-[4px] left-[7px] h-[10px] w-[10px] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(241,245,249,0.94)_100%)]" />
              <div className="absolute bottom-[3px] right-[1px] h-[8px] w-[8px] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.93)_100%)]" />
              <div className="absolute bottom-[5px] left-[10px] h-[2px] w-[6px] rounded-full bg-white/75 blur-[0.5px]" />
            </div>
          </div>

          {/* === TOGGLE KNOB === */}
          <div className={`
            absolute top-1 left-1 w-6 h-6 rounded-full shadow-lg z-20
            transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
            will-change-transform
            ${isDark ? 'translate-x-8' : 'translate-x-0'}
          `}>
            {isDark ? (
              // Moon
              <div
                className="w-full h-full rounded-full relative overflow-hidden shadow-[inset_-2px_-2px_3px_rgba(148,163,184,0.45),inset_2px_2px_3px_rgba(255,255,255,0.55)]"
                style={{
                  background:
                    'radial-gradient(circle at 32% 28%, #f8fafc 0%, #e2e8f0 46%, #cbd5e1 72%, #94a3b8 100%)',
                }}
              >
                <div
                  className="absolute inset-0 rounded-full opacity-55"
                  style={{
                    background:
                      'radial-gradient(circle at 26% 22%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 38%), radial-gradient(circle at 72% 72%, rgba(71,85,105,0.18) 0%, rgba(71,85,105,0) 52%)',
                  }}
                />
                <div className="absolute top-[4px] left-[5px] h-[5px] w-[5px] rounded-full bg-slate-400/40 border border-slate-500/20 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.35)]" />
                <div className="absolute top-[6px] left-[13px] h-[2.5px] w-[2.5px] rounded-full bg-slate-400/35" />
                <div className="absolute top-[10px] left-[12px] h-[4px] w-[4px] rounded-full bg-slate-500/30 border border-slate-500/15" />
                <div className="absolute top-[13px] left-[7px] h-[3px] w-[3px] rounded-full bg-slate-500/28" />
              </div>
            ) : (
              // Sun
              <div
                className="w-full h-full rounded-full relative overflow-hidden sun-glow shadow-[inset_-2px_-2px_3px_rgba(180,83,9,0.28),inset_2px_2px_3px_rgba(255,244,179,0.7)]"
                style={{
                  background:
                    'radial-gradient(circle at 34% 30%, #fff7bf 0%, #fde047 38%, #fbbf24 72%, #f59e0b 100%)',
                }}
              >
                <div
                  className="absolute inset-0 rounded-full opacity-40"
                  style={{
                    background:
                      'repeating-radial-gradient(circle at 40% 38%, rgba(255,255,255,0.18) 0 1px, rgba(255,255,255,0) 1px 3px)',
                  }}
                />
                <div className="absolute inset-[2px] rounded-full border border-amber-100/45" />
                <div
                  className="absolute inset-[3px] rounded-full opacity-50"
                  style={{
                    background:
                      'radial-gradient(circle at 28% 24%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 36%), radial-gradient(circle at 72% 68%, rgba(180,83,9,0.2) 0%, rgba(180,83,9,0) 40%)',
                  }}
                />
                <div className="absolute top-[8px] left-[6px] h-[2px] w-[7px] rounded-full bg-white/40 blur-[0.4px]" />
              </div>
            )}
          </div>
        </div>
      </button>
    </>
  )
}

export default ThemeToggle
