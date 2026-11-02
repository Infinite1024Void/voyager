/** Persisted user preferences; new settings extend this shape over time. */
export interface SettingsShape {
  themeMode?: 'system' | 'light' | 'dark'
  bookmarksBarVisible?: boolean
  clearHistory?: boolean
  clearDownloads?: boolean
  clearBookmarks?: boolean
  openDownloadsWhenDone?: boolean
}
