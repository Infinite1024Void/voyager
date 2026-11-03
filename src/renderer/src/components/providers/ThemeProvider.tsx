import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ThemeMode, ThemeState } from '../../../../shared/types'
import { ThemeContext, type ThemeContextValue } from './theme-context'

export function ThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [state, setState] = useState<ThemeState>({ mode: 'system', dark: false })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.voyager?.theme) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const update = (matches: boolean) => setState({ mode: 'system', dark: matches })
      update(mq.matches)
      const listener = (e: MediaQueryListEvent) => update(e.matches)
      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    }
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
        if (window.voyager?.theme) {
          void window.voyager.theme.set(mode).then(setState)
        } else {
          setState(() => {
            let dark: boolean
            if (mode === 'dark') dark = true
            else if (mode === 'light') dark = false
            else dark = window.matchMedia('(prefers-color-scheme: dark)').matches
            return { mode, dark }
          })
        }
      }
    }),
    [state]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
