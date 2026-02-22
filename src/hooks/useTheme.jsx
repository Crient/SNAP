import { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react'
import { flushSync } from 'react-dom'

const ThemeContext = createContext(null)
const THEME_SWITCH_DURATION_MS = 420

export function ThemeProvider({ children }) {
  // Default to light mode
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('snap-theme')
      if (saved) {
        return saved === 'dark'
      }
    }
    // Default to light
    return false
  })
  const themeSwitchTimeoutRef = useRef(null)

  const beginThemeSwitch = useCallback(() => {
    if (typeof window === 'undefined') return
    const root = document.documentElement
    root.classList.add('theme-switching')
    if (themeSwitchTimeoutRef.current) {
      window.clearTimeout(themeSwitchTimeoutRef.current)
    }
    themeSwitchTimeoutRef.current = window.setTimeout(() => {
      root.classList.remove('theme-switching')
      themeSwitchTimeoutRef.current = null
    }, THEME_SWITCH_DURATION_MS)
  }, [])

  const applyThemeState = useCallback((nextStateUpdater) => {
    if (typeof window === 'undefined') {
      setIsDark(nextStateUpdater)
      return
    }

    const canUseViewTransition = typeof document.startViewTransition === 'function'
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (canUseViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => {
          setIsDark(nextStateUpdater)
        })
      })
      return
    }

    beginThemeSwitch()
    setIsDark(nextStateUpdater)
  }, [beginThemeSwitch])

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    root.style.colorScheme = isDark ? 'dark' : 'light'
    // Persist preference
    localStorage.setItem('snap-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => () => {
    if (themeSwitchTimeoutRef.current) {
      window.clearTimeout(themeSwitchTimeoutRef.current)
    }
    document.documentElement.classList.remove('theme-switching')
  }, [])

  const toggleTheme = useCallback(() => {
    applyThemeState(prev => !prev)
  }, [applyThemeState])

  const setDarkMode = useCallback(() => {
    applyThemeState(() => true)
  }, [applyThemeState])

  const setLightMode = useCallback(() => {
    applyThemeState(() => false)
  }, [applyThemeState])

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
