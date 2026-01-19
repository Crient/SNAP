# SNAP

SNAP is an in-browser photobooth that captures multi-shot layouts, lets you decorate them with backgrounds and stickers, and exports a finished strip—no backend required.

## Features (implemented)
- **Layouts & orientations:** 2×2 grid (4 shots), 3×1 grid (3 shots with orientation-aware arrangement), and 3×2 grid (6 shots). Vertical (1080×1920) or horizontal (1920×1080) sizes; auto-selects orientation when only one is valid.
- **Camera capture:** Front-facing mirrored preview with countdown per shot, flash overlay, ring-light glow (warm/neutral/cool), progress dots, captured thumbnail stack, cancel/reset, and a one-time camera-clean reminder stored in sessionStorage. Handles loading and permission errors with retry/back actions.
- **Preview composition:** Canvas-based assembly that places each shot into the chosen grid so the preview matches export dimensions.
- **Editing & decoration:** Backgrounds via 18 solid colors plus scene (30) and pattern (15) collections filtered by category; lazy-loaded thumbnails and cross-faded background changes. Stickers from 100 element assets (chrome, y2k, cute, retro) added with one click or drag/drop; drag, rotate, resize (ratio-locked), and delete via Moveable controls.
- **Export & reset:** Download a PNG at the selected orientation with backgrounds, photos, and elements applied; start-over control clears the session.
- **Experience polish:** Dark mode by default with toggle persisted to localStorage, animated gradient backdrop, responsive editor with a snapping bottom sheet on mobile, and glassmorphic theming.

## User flow
1) Start from the landing screen.  
2) Choose a layout; pick orientation when more than one is allowed (auto-selected otherwise).  
3) Capture the required shots with the countdown, ring light, and progress indicators; retry or go back if needed.  
4) Review the composed preview; retake or continue.  
5) Customize backgrounds and stickers in the editor; drag/resize/rotate elements in place.  
6) Download the final PNG or start over to run another session.

## Tech stack
- React 19 with Vite 7
- Tailwind CSS 4 plus custom CSS variables/utilities
- react-moveable for drag/rotate/resize controls
- Browser APIs: MediaDevices (camera), Canvas 2D (preview/export), localStorage/sessionStorage

## Architecture
- **Stage flow (`App.jsx`):** Central stage machine (landing → layout → orientation → capture → preview → editor) holding layout, orientation, and captured photos.
- **Layout config (`lib/layouts.js`):** `LAYOUTS`, `ORIENTATIONS`, and `getGridConfig` define shot counts, grid dimensions, and camera aspect overrides per layout/orientation.
- **Camera handling (`useCamera`, `PhotoBooth`):** Manages permissions, mobile-friendly constraints, stream lifecycle, mirrored preview, ring-light overlays, countdown/flash, crop calculation to preserve aspect ratio, and per-shot capture to data URLs.
- **Composition (`Preview`):** Canvas renders the selected grid with padding/gaps, rounded corners/shadows, and produces a composed preview image.
- **Editor (`Editor`):** Responsive canvas + tool panel (side panel on desktop, snapping bottom sheet on mobile). Background selection (solid/scene/pattern), element catalog from `lib/assetCategories.js`, element placement stored as percentages for consistent export, and PNG export via an off-screen canvas. Uses Moveable for transform handles and throttles background transitions.
- **Theming & chrome:** `ThemeProvider` persists dark/light choice; `AnimatedBackground` supplies the gradient/blobs layer; `ThemeToggle` swaps themes. Styles live in `index.css` (Tailwind @imports plus custom tokens and utility classes).
- **Assets & tooling:** Static assets under `public/assets` (backgrounds/scenes, backgrounds/patterns, elements). `scripts/compress-images.js` is an optional Sharp-based optimizer for those assets. `vite.config.js` splits vendor/moveable chunks for caching.

## Getting started
```bash
npm install
npm run dev     # start locally
npm run lint    # lint check
npm run build   # production build
```

## Project structure
```
src/
├── App.jsx
├── components/
│   ├── AnimatedBackground.jsx
│   ├── Editor.jsx
│   ├── Landing.jsx
│   ├── LayoutSelector.jsx
│   ├── OrientationSelector.jsx
│   ├── PhotoBooth.jsx
│   ├── Preview.jsx
│   └── ThemeToggle.jsx
├── hooks/
│   ├── useCamera.js
│   ├── useLazyImage.js      # IntersectionObserver helper (currently unused)
│   └── useTheme.jsx
├── lib/
│   ├── assetCategories.js   # Asset catalogs + paths
│   └── layouts.js           # Layout/orientation configs + grid helper
├── index.css                # Tailwind layer + custom design tokens/utilities
└── main.jsx
public/assets/
├── backgrounds/
│   ├── scenes/
│   └── patterns/
└── elements/
scripts/
└── compress-images.js
vite.config.js
```

## Privacy
All processing stays in the browser: camera streams, captures, previews, and exports never leave the device. Local persistence is limited to theme preference (localStorage) and a one-time camera reminder flag (sessionStorage). No analytics or network calls are made.

## Future work
- Text/label tool with font and color controls.
- Multiple export presets (e.g., square or print-ready sizes) and quality settings.
- Session persistence for re-editing, plus camera/source selection for multi-camera setups.
