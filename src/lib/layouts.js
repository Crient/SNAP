// Orientation configurations with export sizes
export const ORIENTATIONS = {
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
export const LAYOUTS = [
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
  if (layout?.gridByOrientation && orientation) {
    return layout.gridByOrientation[orientation.id] || layout.grid
  }
  return layout?.grid
}
