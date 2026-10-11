/**
 * Application-wide types shared between the main process, the chrome preload,
 * and the React chrome renderer.
 */

export type ThemeMode = 'system' | 'light' | 'dark'

/** Resolved theme: `mode` is the user preference, `dark` the effective scheme. */
export interface ThemeState {
  mode: ThemeMode
  dark: boolean
}

export interface AppVersionInfo {
  app: string
  electron: string
  chrome: string
  node: string
}

/** Callback signature returned by event subscription APIs. */
export type Unsubscribe = () => void