import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ThemeMode, ThemeState } from '../../../../shared/types'

interface ThemeContextValue {
  mode: ThemeMode
  dark: boolean
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [state, setState] = useState<ThemeState>({ mode: 'system', dark: false })

  useEffect(() => {
    void window.voyager.theme.get().then(setState)
    return window.voyager.theme.onChanged(setState)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.dark)
  }, [state.dark])

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode: state.mode,
      dark: state.dark,
      setMode: (mode: ThemeMode) => {
        void window.voyager.theme.set(mode)
      }
    }),
    [state]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}