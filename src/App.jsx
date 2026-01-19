import { useState } from 'react'
import Landing from './components/Landing'
import LayoutSelector from './components/LayoutSelector'
import OrientationSelector from './components/OrientationSelector'
import PhotoBooth from './components/PhotoBooth'
import Preview from './components/Preview'
import Editor from './components/Editor'
import ThemeToggle from './components/ThemeToggle'
import AnimatedBackground from './components/AnimatedBackground'
import { LAYOUTS, ORIENTATIONS } from './lib/layouts'

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
      <AnimatedBackground />

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Main Content */}
      <main className="relative z-10">
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
      </main>
    </div>
  )
}

export default App
