import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './hooks/useTheme.jsx'
import './index.css'
import App from './App.jsx'

const root = createRoot(document.getElementById('root'))

root.render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)

const bootLoader = document.getElementById('boot-loader')
if (bootLoader) {
  window.__snapHideBoot = () => {
    if (bootLoader.classList.contains('boot-hide')) return
    bootLoader.classList.add('boot-hide')
    window.setTimeout(() => {
      bootLoader.remove()
    }, 350)
  }
}
