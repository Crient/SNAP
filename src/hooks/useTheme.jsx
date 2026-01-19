import { useState, useEffect, createContext, useContext } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  // Default to dark mode
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('snap-theme')
      if (saved) {
        return saved === 'dark'
      }
    }
    // Default to dark
    return true
  })

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    // Persist preference
    localStorage.setItem('snap-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = () => setIsDark(prev => !prev)
  const setDarkMode = () => setIsDark(true)
  const setLightMode = () => setIsDark(false)

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setDarkMode, setLightMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
