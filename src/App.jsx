import { useState } from 'react'
import Landing from './components/Landing'
import LayoutSelector from './components/LayoutSelector'
import OrientationSelector from './components/OrientationSelector'
import PhotoBooth from './components/PhotoBooth'
import Preview from './components/Preview'
import Editor from './components/Editor'
import ThemeToggle from './components/ThemeToggle'
import AnimatedBackground from './components/AnimatedBackground'

// App stages
const STAGES = {
  LANDING: 'landing',
  LAYOUT: 'layout',
  ORIENTATION: 'orientation',
  CAPTURE: 'capture',
  PREVIEW: 'preview',
  EDITOR: 'editor',
}

// Orientation configurations with export sizes
const ORIENTATIONS = {
  vertical: {
    id: 'vertical',
    name: 'Vertical',
    description: 'Story-style (9:16)',
    icon: '📱',
    aspectRatio: 9 / 16,
    width: 1080,
    height: 1920,
  },
  horizontal: {
    id: 'horizontal',
    name: 'Horizontal',
    description: 'Landscape (16:9)',
    icon: '🖥️',
    aspectRatio: 16 / 9,
    width: 1920,
    height: 1080,
  },
}

// Data-driven layout configurations
const LAYOUTS = [
  {
    id: 'grid-2x2',
    name: '2×2 Grid',
    description: '4 photos in a grid',
    icon: '⊞',
    shots: 4,
    allowedOrientations: ['vertical', 'horizontal'],
    grid: { rows: 2, cols: 2 },
  },
  {
    id: 'grid-3x1',
    name: '3×1 Grid',
    description: '3 photos',
    icon: '☰',
    shots: 3,
    allowedOrientations: ['vertical', 'horizontal'],
    gridByOrientation: {
      vertical: { rows: 3, cols: 1 },
      horizontal: { rows: 1, cols: 3 },
    },
    // Camera aspect ratio is INVERTED for this layout
    cameraAspectByOrientation: {
      vertical: 16 / 9,
      horizontal: 9 / 16,
    },
  },
  {
    id: 'grid-3x2',
    name: '3×2 Grid',
    description: '6 photos',
    icon: '▦',
    shots: 6,
    allowedOrientations: ['vertical', 'horizontal'],
    gridByOrientation: {
      vertical: { rows: 3, cols: 2 },
      horizontal: { rows: 2, cols: 3 },
    },
  },
]

// Helper to get grid config for a layout + orientation combination
export function getGridConfig(layout, orientation) {
  if (layout.gridByOrientation && orientation) {
    return layout.gridByOrientation[orientation.id] || layout.grid
  }
  return layout.grid
}

function App() {
  const [stage, setStage] = useState(STAGES.LANDING)
  const [selectedLayout, setSelectedLayout] = useState(null)
  const [selectedOrientation, setSelectedOrientation] = useState(null)
  const [capturedPhotos, setCapturedPhotos] = useState([])
  const [composedImage, setComposedImage] = useState(null)
  const [editedImage, setEditedImage] = useState(null)

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

  const handlePreviewConfirm = (image) => {
    setComposedImage(image)
    setStage(STAGES.EDITOR)
  }

  const handleEditorComplete = (image) => {
    setEditedImage(image)
  }

  const handleReset = () => {
    setStage(STAGES.LANDING)
    setSelectedLayout(null)
    setSelectedOrientation(null)
    setCapturedPhotos([])
    setComposedImage(null)
    setEditedImage(null)
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
            image={composedImage}
            onComplete={handleEditorComplete}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  )
}

export default App
