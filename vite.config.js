import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'moveable': ['react-moveable'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Use default esbuild minifier (faster and built-in)
    minify: 'esbuild',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
