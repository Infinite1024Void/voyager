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

/* ---- Browser / tabs ---------------------------------------------------- */

export interface TabState {
  id: string
  title: string
  url: string
  loading: boolean
  favicon: string | null
  canGoBack: boolean
  canGoForward: boolean
  pinned: boolean
  muted: boolean
  hasAudio: boolean
  crashed: boolean
}

export interface BrowserState {
  tabs: TabState[]
  activeTabId: string | null
}

export interface NewTabRequest {
  url?: string
  active?: boolean
}

export interface NewBookmarkInput {
  title: string
  url: string
}

export interface BookmarkItem {
  id: string
  title: string
  url: string
  createdAt: number
}

export interface BookmarksState {
  items: BookmarkItem[]
  barVisible: boolean
}

export interface HistoryEntry {
  id: string
  url: string
  title: string
  visitedAt: number
  visitCount: number
}

export interface HistoryState {
  entries: HistoryEntry[]
}