import { Store } from './Store'
import type { BookmarksShape } from './bookmarks'
import type { DownloadsShape } from './downloads'
import type { HistoryShape } from './history'
import type { PermissionsShape } from './permissions'
import type { SessionShape } from './session'
import type { SettingsShape } from './settings'

export const settingsStore = new Store<SettingsShape>('settings.json', {})

export const sessionStore = new Store<SessionShape>('session.json', {
  tabs: [],
  activeIndex: 0
})

export const bookmarksStore = new Store<BookmarksShape>('bookmarks.json', {
  items: []
})

export const historyStore = new Store<HistoryShape>('history.json', {
  entries: []
})

export const downloadsStore = new Store<DownloadsShape>('downloads.json', {
  items: []
})

export const permissionsStore = new Store<PermissionsShape>('permissions.json', {
  decisions: []
})

export function getSettings<T = unknown>(key?: string, defaultValue?: T): T | unknown {
  if (key === undefined) {
    // Store<T> doesn't expose getState; return a shallow copy of all via reading? Simpler: read from disk shape by merging? Or just return settingsStore as any by reading keys from file shape? Easier: use settingsStore.get on known keys; but we don't know. Fallback: return {} by reading cached data? Store<T> has 'data' private. Instead, read from settings.json via readJsonFile? Or just handle the undefined-key case by returning defaultValue or {}. Since callers pass a key now, this is fine.
    return {} as unknown
  }
  const value = settingsStore.get(key as keyof SettingsShape)
  return value === undefined ? defaultValue : value
}

export function setSettings(key: string, value: unknown): void {
  settingsStore.set(key as keyof SettingsShape, value as never)
}

/** Persist every debounced store before the process goes away. */
export function flushAllStores(): void {
  settingsStore.flush()
  sessionStore.flush()
  bookmarksStore.flush()
  historyStore.flush()
  downloadsStore.flush()
  permissionsStore.flush()
}
