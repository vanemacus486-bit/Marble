import { useEffect } from 'react'
import { useUiStore } from '../stores/ui-store'

export function useTheme() {
  const { theme, setTheme } = useUiStore()

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches)
      document.documentElement.classList.toggle('dark', isDark)
    }
    updateTheme()
    mediaQuery.addEventListener('change', updateTheme)
    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [theme])

  return { theme, setTheme }
}
