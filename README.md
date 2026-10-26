# SNAP 

SNAP is an in-browser digital photobooth that captures multi-shot layouts, lets users decorate them with backgrounds and stickers, and exports a finished strip — all locally, with no backend required.

## Features

### Capture
- Multi-shot layouts: 2×2, 3×1, 3×2
- Orientation-aware exports (vertical and horizontal)
- Front-facing mirrored camera preview
- Countdown timer, flash overlay, and ring-light glow
- Progress indicators, retake, cancel, and reset flows
- One-time camera clean reminder stored per session

### Edit
- Canvas-based preview matching final export dimensions
- Solid, scene, and pattern backgrounds
- Sticker library with 170 stickers, drag/rotate/resize controls, lock/duplicate/delete actions
- 125 backgrounds (solid, scene, and pattern) with category-based browsing
- Frame editing with hide/show, drag-to-swap, and undo/redo
- Responsive editor with mobile-friendly layout

### Export & Experience
- High-resolution PNG export (HD and QHD presets)
- Dark mode with persisted preference
- Animated gradient background and glassmorphic theming
- Route-level lazy loading, thumbnail lazy loading, and compressed asset pipeline
- Fully client-side processing

---

## User Flow

Landing → Layout → Orientation → Capture → Preview → Edit → Export

---

## Tech Stack

- React 19 with Vite 7
- Tailwind CSS 4 with custom design tokens
- react-moveable for drag, rotate, and resize controls
- Browser APIs:
  - MediaDevices (camera access)
  - Canvas 2D (preview and export)
  - localStorage and sessionStorage

---

## Getting Started

```bash
npm install
npm run dev
```

---

## Live Demo
https://snapdigital.vercel.app

---

## Project Structure
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
│   ├── useLazyImage.js
│   └── useTheme.jsx
├── lib/
│   ├── assetCategories.js
│   └── layouts.js
├── index.css
└── main.jsx

public/assets/
├── backgrounds/
│   ├── scenes/
│   └── patterns/
└── elements/

scripts/
├── compress-images.js
└── generate-thumbs.js

vite.config.js
```

---

## Architecture Notes
- Central stage flow manages transitions between capture, preview, and editing
- Layout and orientation behavior defined through configuration helpers
- Camera lifecycle and permissions handled via a dedicated hook
- Canvas used for both preview rendering and final export
- Editor stores element positions as percentages for consistent scaling

---

## Privacy
All processing stays entirely in the browser.
Camera streams, captures, previews, and exports never leave the device.

Local persistence is limited to:
- Theme preference (localStorage)
- One-time camera reminder flag (sessionStorage)

No analytics or tracking are included, and photos are never uploaded.
Network requests are limited to loading app assets/dependencies.

---

## Future Work
- Text tool with font and color controls
- Additional export presets beyond HD/QHD
- Session persistence for re-editing
- Multi-camera and input source selection

## Free Cloudflare migration preview

The `hosting/free-cloudflare-preview-20261026` branch starts at deployed commit `23dc8ba74cd3a2b8a04abdd1fc569447ebef874b`. Application source and all camera/export behavior are unchanged.

Run `npm ci --ignore-scripts`, `npm run build:cloudflare`, and `npm run check:cloudflare`. The build has 659 assets; its largest file is 14,451,847 bytes, within Pages Free's 25 MiB per-file / 20,000-file limits. No Functions, storage subscriptions or backend secrets are needed. The synthetic-camera browser check exports a valid 1440×2560 PNG.

The separate Pages project is `leng-snap-preview-20261026`, with reserved production branch `owner-approved-production`. `CLOUDFLARE_ACCOUNT_ID=07f48608f6c0c2e51553c6f0d53418ea npm run deploy:cloudflare-preview` always publishes branch `migration-20261026`, not production. Keep the resulting preview URL separate from `snapdigital.vercel.app`; no existing project or domain changes. Free-plan limits can stop builds/requests but no paid plan is activated here.

Cloudflare references: https://developers.cloudflare.com/pages/platform/limits/ and https://developers.cloudflare.com/pages/configuration/preview-deployments/ .
