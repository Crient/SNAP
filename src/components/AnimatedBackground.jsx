/**
 * AnimatedBackground - Liquid plasma glow effect
 * Gen-Z aesthetic with premium, camera-focused feel
 * Respects prefers-reduced-motion
 */

function AnimatedBackground() {
  return (
    <div className="animated-bg-container">
      {/* Base gradient layer */}
      <div className="animated-bg-base" />
      
      {/* Two main glow sources in opposite corners */}
      <div className="animated-bg-orb orb-1" />
      <div className="animated-bg-orb orb-2" />
      
      {/* Film grain overlay */}
      <div className="animated-bg-grain" />
    </div>
  )
}

export default AnimatedBackground
