import { Store } from './Store'
import type { BookmarksShape } from './bookmarks'
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

/** Persist every debounced store before the process goes away. */
export function flushAllStores(): void {
  settingsStore.flush()
  sessionStore.flush()
  bookmarksStore.flush()
}

export function getSettings<K extends keyof SettingsShape>(key: K): SettingsShape[K] {
  return settingsStore.get(key)
}

export function setSettings<K extends keyof SettingsShape>(key: K, value: SettingsShape[K]): void {
  settingsStore.set(key, value)
}