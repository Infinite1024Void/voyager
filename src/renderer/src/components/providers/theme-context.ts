import { createContext, useContext } from 'react'
import type { ThemeMode } from '../../../../shared/types'

export interface ThemeContextValue {
  mode: ThemeMode
  dark: boolean
  setMode: (mode: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

/** Access the resolved theme mode/state for the chrome UI. */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
