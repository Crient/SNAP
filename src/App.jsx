import { useState, Suspense, lazy } from 'react'
import Landing from './components/Landing'
import ThemeToggle from './components/ThemeToggle'
import AnimatedBackground from './components/AnimatedBackground'
import { LAYOUTS, ORIENTATIONS } from './lib/layouts'

const LayoutSelector = lazy(() => import('./components/LayoutSelector'))
const OrientationSelector = lazy(() => import('./components/OrientationSelector'))
const PhotoBooth = lazy(() => import('./components/PhotoBooth'))
const Preview = lazy(() => import('./components/Preview'))
const Editor = lazy(() => import('./components/Editor'))

function StageLoader({ label }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-10 w-10 rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-brand-primary)] animate-spin" />
        <p className="text-[var(--color-text-secondary)] font-semibold">{label}</p>
      </div>
    </div>
  )
}

// App stages
const STAGES = {
  LANDING: 'landing',
  LAYOUT: 'layout',
  ORIENTATION: 'orientation',
  CAPTURE: 'capture',
  PREVIEW: 'preview',
  EDITOR: 'editor',
}

function App() {
  const [stage, setStage] = useState(STAGES.LANDING)
  const [selectedLayout, setSelectedLayout] = useState(null)
  const [selectedOrientation, setSelectedOrientation] = useState(null)
  const [capturedPhotos, setCapturedPhotos] = useState([])
  const showFlowGlassLayer = stage !== STAGES.LANDING

  const handleStart = () => {
    setStage(STAGES.LAYOUT)
  }

  const handleLayoutSelect = (layout) => {
    setSelectedLayout(layout)
    
    if (layout.allowedOrientations.length === 1) {
      const autoOrientation = ORIENTATIONS[layout.allowedOrientations[0]]
      setSelectedOrientation(autoOrientation)
      setStage(STAGES.CAPTURE)
    } else {
      setStage(STAGES.ORIENTATION)
    }
  }

  const handleOrientationSelect = (orientation) => {
    setSelectedOrientation(orientation)
    setStage(STAGES.CAPTURE)
  }

  const handleCaptureComplete = (photos) => {
    setCapturedPhotos(photos)
    setStage(STAGES.PREVIEW)
  }

  const handlePreviewConfirm = () => {
    setStage(STAGES.EDITOR)
  }

  const handleReset = () => {
    setStage(STAGES.LANDING)
    setSelectedLayout(null)
    setSelectedOrientation(null)
    setCapturedPhotos([])
  }

  const handleBack = () => {
    switch (stage) {
      case STAGES.LAYOUT:
        setStage(STAGES.LANDING)
        break
      case STAGES.ORIENTATION:
        setStage(STAGES.LAYOUT)
        break
      case STAGES.CAPTURE:
        if (selectedLayout?.allowedOrientations.length === 1) {
          setStage(STAGES.LAYOUT)
        } else {
          setStage(STAGES.ORIENTATION)
        }
        break
      case STAGES.PREVIEW:
        setStage(STAGES.CAPTURE)
        setCapturedPhotos([])
        break
      case STAGES.EDITOR:
        setStage(STAGES.PREVIEW)
        break
      default:
        break
    }
  }

  const getAllowedOrientations = () => {
    if (!selectedLayout) return Object.values(ORIENTATIONS)
    return selectedLayout.allowedOrientations.map(id => ORIENTATIONS[id])
  }

  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <AnimatedBackground interactive={stage === STAGES.LANDING} />

      {/* Glass backdrop for post-landing flow screens */}
      <div
        aria-hidden="true"
        className={`flow-glass-layer ${showFlowGlassLayer ? 'is-visible' : ''}`}
      />

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Main Content */}
      <main className="relative z-10">
        <Suspense fallback={<StageLoader label="Loading..." />}>
          {stage === STAGES.LANDING && (
            <Landing onStart={handleStart} />
          )}

          {stage === STAGES.LAYOUT && (
            <LayoutSelector 
              layouts={LAYOUTS} 
              onSelect={handleLayoutSelect}
              onBack={handleBack}
            />
          )}

          {stage === STAGES.ORIENTATION && (
            <OrientationSelector
              orientations={getAllowedOrientations()}
              selectedLayout={selectedLayout}
              onSelect={handleOrientationSelect}
              onBack={handleBack}
            />
          )}

          {stage === STAGES.CAPTURE && (
            <PhotoBooth 
              layout={selectedLayout}
              orientation={selectedOrientation}
              onComplete={handleCaptureComplete}
              onBack={handleBack}
            />
          )}

          {stage === STAGES.PREVIEW && (
            <Preview 
              photos={capturedPhotos}
              layout={selectedLayout}
              orientation={selectedOrientation}
              onConfirm={handlePreviewConfirm}
              onRetake={handleBack}
            />
          )}

          {stage === STAGES.EDITOR && (
            <Editor 
              photos={capturedPhotos}
              layout={selectedLayout}
              orientation={selectedOrientation}
              onReset={handleReset}
            />
          )}
        </Suspense>
      </main>
    </div>
  )
}

export default App
