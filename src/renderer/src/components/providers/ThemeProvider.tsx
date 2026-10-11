import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ThemeMode, ThemeState } from '../../../../shared/types'
import { ThemeContext, type ThemeContextValue } from './theme-context'

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