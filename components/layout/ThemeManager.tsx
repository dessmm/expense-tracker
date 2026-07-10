'use client'

import { useEffect } from 'react'

export function ThemeManager() {
  useEffect(() => {
    // 1. Initial application of theme
    function applyTheme() {
      const activeTheme = localStorage.getItem('theme')
      if (activeTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (activeTheme === 'light') {
        document.documentElement.classList.remove('dark')
      } else {
        // system theme fallback
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (systemDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }

    applyTheme()

    // 2. Listen to system preference changes (Asia/Manila time zone or OS level)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const activeTheme = localStorage.getItem('theme')
      // Only apply system change if user has not explicitly locked in light/dark
      if (!activeTheme || activeTheme === 'system') {
        if (e.matches) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }

    // Modern browsers support addEventListener
    mediaQuery.addEventListener('change', handleSystemThemeChange)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [])

  return null
}

