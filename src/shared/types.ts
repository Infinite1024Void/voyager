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
  favicon?: string | null
}

/* ---- Site permissions -------------------------------------------------- */

/**
 * Browser-level permission categories. Electron reports raw Chromium
 * permission names; these are the stable categories shown in prompts and
 * Settings.
 */
export type PermissionKind =
  | 'geolocation'
  | 'notifications'
  | 'camera'
  | 'microphone'
  | 'camera-microphone'
  | 'clipboard-read'
  | 'display-capture'
  | 'midi'
  | 'device-access'
  | 'other'

export type PermissionDecision = 'allow' | 'block'

export interface SitePermissionDecision {
  origin: string
  kind: PermissionKind
  decision: PermissionDecision
  updatedAt: number
}

export interface SitePermissionsState {
  decisions: SitePermissionDecision[]
}

export type PermissionRequestChoice = 'allow-site' | 'allow-once' | 'block' | 'dismiss'

export interface PermissionPromptRequest {
  id: string
  origin: string
  host: string
  kind: PermissionKind
  tabId: string | null
}

export interface PermissionPromptCancelled {
  id: string
}

/** Optional route passed when opening Settings from a site-info popover. */
export interface SettingsTarget {
  page?: 'site-permissions'
  origin?: string
}

export interface BookmarkItem {
  id: string
  title: string
  url: string
  favicon?: string | null
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

export interface DownloadItem {
  id: string
  url: string
  filename: string
  receivedBytes: number
  totalBytes: number
  state: 'progressing' | 'completed' | 'interrupted' | 'cancelled'
  paused?: boolean
  path?: string
  startTime: number
  endTime?: number
}

export interface DownloadsState {
  items: DownloadItem[]
}

/** User preferences exposed to the settings window. */
export interface UserPreferences {
  clearHistory: boolean
  clearDownloads: boolean
  clearBookmarks: boolean
  openDownloadsWhenDone: boolean
}
