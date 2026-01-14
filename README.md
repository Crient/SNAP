# SNAP - Digital Photo Booth 📸

A web-based digital photo booth experience that runs entirely in your browser.

## Features

- 🎨 **Multiple Layouts** - 2×2 Grid, Vertical Strip, Double Strip
- 📷 **Live Camera Preview** - Front-facing camera with real-time preview
- ⏱️ **Countdown Timer** - Automatic countdown before each photo
- 🖼️ **Photo Composition** - Canvas-based high-resolution image generation
- ✨ **Stickers & Text** - Drag, scale, and rotate overlays
- 📥 **Easy Export** - Download your creation as PNG

## Tech Stack

- React 19
- Tailwind CSS 4
- Vite
- Browser Web APIs (MediaDevices, Canvas)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then open http://localhost:5173 in your browser.

## Project Structure

```
src/
├── components/
│   ├── Landing.jsx      # Welcome screen with start button
│   ├── LayoutSelector.jsx # Choose photo layout
│   ├── PhotoBooth.jsx   # Camera preview and capture
│   ├── Preview.jsx      # Review composed photos
│   └── Editor.jsx       # Add stickers and text
├── hooks/
│   └── useCamera.js     # Camera access management
├── App.jsx              # Main app with stage management
├── main.jsx             # Entry point
└── index.css            # Global styles with Tailwind
```

## Browser Requirements

- Modern browser with WebRTC support
- Camera permissions enabled
- Works best on Chrome, Firefox, Safari, Edge

## Privacy

All processing happens locally in your browser. No photos are uploaded to any server.
