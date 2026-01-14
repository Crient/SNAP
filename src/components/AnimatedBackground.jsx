/**
 * AnimatedBackground - Scattered gradient blobs
 * Organic, grainy gradient blobs across viewport
 * Respects prefers-reduced-motion
 */

function AnimatedBackground() {
  // Blob configurations - position, size, colors, animation delay
  const blobs = [
    // Top row
    { id: 1, top: '5%', left: '5%', size: 120, lightColors: ['#ff6b6b', '#feca57'], darkColors: ['#667eea', '#764ba2'], delay: 0 },
    { id: 2, top: '8%', left: '35%', size: 100, lightColors: ['#ff9ff3', '#feca57'], darkColors: ['#5f72bd', '#9b59b6'], delay: 0.5 },
    { id: 3, top: '3%', left: '65%', size: 140, lightColors: ['#ffeaa7', '#fdcb6e'], darkColors: ['#4facfe', '#00f2fe'], delay: 1 },
    { id: 4, top: '10%', left: '85%', size: 90, lightColors: ['#fd79a8', '#e84393'], darkColors: ['#667eea', '#764ba2'], delay: 1.5 },
    
    // Upper middle
    { id: 5, top: '25%', left: '10%', size: 110, lightColors: ['#fdcb6e', '#e17055'], darkColors: ['#a18cd1', '#fbc2eb'], delay: 0.3 },
    { id: 6, top: '30%', left: '75%', size: 130, lightColors: ['#fab1a0', '#e17055'], darkColors: ['#4facfe', '#00f2fe'], delay: 0.8 },
    
    // Middle row
    { id: 7, top: '45%', left: '3%', size: 100, lightColors: ['#ffeaa7', '#fab1a0'], darkColors: ['#667eea', '#764ba2'], delay: 1.2 },
    { id: 8, top: '50%', left: '90%', size: 120, lightColors: ['#ff9ff3', '#f368e0'], darkColors: ['#5f72bd', '#9b59b6'], delay: 0.6 },
    
    // Lower middle
    { id: 9, top: '65%', left: '15%', size: 130, lightColors: ['#fdcb6e', '#ffeaa7'], darkColors: ['#a18cd1', '#fbc2eb'], delay: 1.8 },
    { id: 10, top: '60%', left: '80%', size: 100, lightColors: ['#ff6b6b', '#ee5a24'], darkColors: ['#4facfe', '#43e97b'], delay: 0.2 },
    
    // Bottom row
    { id: 11, top: '80%', left: '8%', size: 110, lightColors: ['#fab1a0', '#ff7675'], darkColors: ['#667eea', '#764ba2'], delay: 1.4 },
    { id: 12, top: '85%', left: '40%', size: 90, lightColors: ['#ffeaa7', '#fdcb6e'], darkColors: ['#5f72bd', '#a18cd1'], delay: 0.9 },
    { id: 13, top: '78%', left: '70%', size: 140, lightColors: ['#ff9ff3', '#fd79a8'], darkColors: ['#4facfe', '#00f2fe'], delay: 1.1 },
    { id: 14, top: '90%', left: '92%', size: 100, lightColors: ['#e17055', '#d63031'], darkColors: ['#667eea', '#764ba2'], delay: 0.4 },
  ]

  return (
    <div className="animated-bg-container">
      {/* Base layer */}
      <div className="animated-bg-base" />
      
      {/* Large ambient orbs - depth & brand */}
      <div className="animated-bg-orb orb-plum" />
      <div className="animated-bg-orb orb-red" />
      <div className="animated-bg-orb orb-pink" />
      
      {/* Scattered gradient blobs - texture & life */}
      {blobs.map((blob) => (
        <div
          key={blob.id}
          className="gradient-blob"
          style={{
            top: blob.top,
            left: blob.left,
            width: blob.size,
            height: blob.size,
            '--light-color-1': blob.lightColors[0],
            '--light-color-2': blob.lightColors[1],
            '--dark-color-1': blob.darkColors[0],
            '--dark-color-2': blob.darkColors[1],
            animationDelay: `${blob.delay}s`,
          }}
        />
      ))}
      
      {/* Film grain overlay */}
      <div className="animated-bg-grain" />
    </div>
  )
}

export default AnimatedBackground
