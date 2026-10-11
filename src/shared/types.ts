/**
 * Application-wide types shared between the main process, the chrome preload,
 * and the React chrome renderer.
 */

export type ThemeMode = 'system' | 'light' | 'dark'

export interface AppVersionInfo {
  app: string
  electron: string
  chrome: string
  node: string
}

/** Callback signature returned by event subscription APIs. */
export type Unsubscribe = () => void