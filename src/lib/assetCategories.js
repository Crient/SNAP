/**
 * Asset Category Mappings
 * 
 * This file contains the category assignments for all assets.
 * Categories are filters, not hierarchy - assets can belong to multiple categories.
 */

// ============================================
// ELEMENT CATEGORIES
// ============================================
// Categories: chrome, y2k, cute, retro
// Elements can belong to multiple categories

export const ELEMENT_CATEGORIES = {
  chrome: {
    name: 'Chrome / Metallic',
    elements: [11, 12, 14, 15, 16, 18, 19, 20, 27, 28, 29, 30, 33, 34, 36, 38, 43, 51, 56, 58, 59, 60, 95, 96, 97, 98, 99]
  },
  y2k: {
    name: 'Y2K / Digital',
    elements: [3, 5, 7, 8, 9, 10, 13, 15, 16, 17, 22, 23, 24, 25, 26, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 45, 46, 47, 48, 49, 50, 52, 53, 54, 55, 58, 60, 65, 74, 81, 82, 83, 90, 91, 94, 96]
  },
  cute: {
    name: 'Cute / Playful',
    elements: [1, 2, 3, 4, 6, 12, 13, 18, 19, 21, 27, 28, 29, 35, 40, 43, 44, 50, 51, 52, 55, 57, 62, 67, 68, 70, 78, 79, 80, 81, 82, 84, 86, 87, 88, 89, 90, 92, 93, 95, 96, 97, 98, 99, 100]
  },
  retro: {
    name: 'Retro / Groovy',
    elements: [2, 4, 5, 7, 8, 9, 10, 17, 23, 25, 26, 31, 32, 34, 35, 38, 39, 45, 48, 49, 53, 54, 55, 57, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 72, 73, 74, 75, 76, 77, 78, 79, 81, 82, 83, 85, 88, 91, 92, 93, 94]
  }
};

// Helper: Get categories for a specific element
export function getElementCategories(elementNum) {
  const categories = [];
  for (const [key, data] of Object.entries(ELEMENT_CATEGORIES)) {
    if (data.elements.includes(elementNum)) {
      categories.push(key);
    }
  }
  return categories;
}

// Helper: Get all elements for a category (or all if category is 'all')
export function getElementsByCategory(category) {
  if (category === 'all') {
    return Array.from({ length: 100 }, (_, i) => i + 1);
  }
  return ELEMENT_CATEGORIES[category]?.elements || [];
}

// Generate element paths
export function getElementPath(num) {
  return `/assets/elements/el_${String(num).padStart(3, '0')}.png`;
}

// Generate element thumbnail paths (WebP, 256-384px)
export function getElementThumbPath(num) {
  return `/assets/elements/thumbs/el_${String(num).padStart(3, '0')}.webp`;
}

// ============================================
// SCENE BACKGROUND CATEGORIES
// ============================================
// Categories: cute, y2k, retro, clean, party
// Will be populated after scanning scenes

export const SCENE_CATEGORIES = {
  cute: {
    name: 'Cute / Playful',
    scenes: [2, 14, 15, 17, 18, 21, 22, 27, 28, 29] // Pink sparkles, glitter, fur, pastels, swirls, stars, butterfly
  },
  y2k: {
    name: 'Y2K / Digital',
    scenes: [1, 3, 5, 6, 7, 8, 9, 10, 13, 16, 17, 19, 21, 23, 27] // Chrome, holographic, liquid metal, iridescent
  },
  retro: {
    name: 'Retro / Groovy',
    scenes: [4, 11, 24, 26, 28, 29, 30] // Sunburst, watercolor, marble swirl, stars, butterfly, groovy
  },
  clean: {
    name: 'Clean / Aesthetic',
    scenes: [1, 2, 3, 6, 7, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 23, 24, 25, 26] // Gradients, minimal, soft textures
  },
  party: {
    name: 'Party / Celebration',
    scenes: [4, 8, 22, 28, 30] // Sunburst, holographic foil, rainbow sparkles, stars, groovy burst
  }
};

// Helper: Get all scenes for a category
export function getScenesByCategory(category) {
  if (category === 'all') {
    return Array.from({ length: 30 }, (_, i) => i + 1);
  }
  return SCENE_CATEGORIES[category]?.scenes || [];
}

// Generate scene paths
export function getScenePath(num) {
  return `/assets/backgrounds/scenes/bgs_${String(num).padStart(3, '0')}.png`;
}

// Generate scene thumbnail paths (WebP, 256-384px)
export function getSceneThumbPath(num) {
  return `/assets/backgrounds/scenes/thumbs/bgs_${String(num).padStart(3, '0')}.webp`;
}

// ============================================
// PATTERN BACKGROUND CATEGORIES
// ============================================
// Categories: hearts, grid, waves, texture, minimal
// Will be populated after scanning patterns

export const PATTERN_CATEGORIES = {
  hearts: {
    name: 'Hearts / Cute',
    patterns: [2, 5, 10, 14] // Pixel cats, bows, hearts checker, cute items
  },
  grid: {
    name: 'Grid / Checker',
    patterns: [1, 5, 7, 8, 9, 10, 11, 12, 15] // Various checkers
  },
  waves: {
    name: 'Waves / Organic',
    patterns: [1, 3, 8, 9, 12, 13, 15] // Wavy/organic patterns
  },
  texture: {
    name: 'Texture / Noise',
    patterns: [4, 6] // Cow print, red fabric
  },
  minimal: {
    name: 'Minimal / Clean',
    patterns: [11, 12] // Simple checker, grid lines
  }
};

// Helper: Get all patterns for a category
export function getPatternsByCategory(category) {
  if (category === 'all') {
    return Array.from({ length: 15 }, (_, i) => i + 1);
  }
  return PATTERN_CATEGORIES[category]?.patterns || [];
}

// Generate pattern paths
export function getPatternPath(num) {
  return `/assets/backgrounds/patterns/bgp_${String(num).padStart(3, '0')}.png`;
}

// Generate pattern thumbnail paths (WebP, 256-384px)
export function getPatternThumbPath(num) {
  return `/assets/backgrounds/patterns/thumbs/bgp_${String(num).padStart(3, '0')}.webp`;
}
