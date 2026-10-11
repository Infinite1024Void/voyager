import { Store } from './Store'

/** Persisted user preferences; new settings extend this shape over time. */
export interface SettingsShape {
  themeMode?: 'system' | 'light' | 'dark'
}

export const settingsStore = new Store<SettingsShape>('settings.json', {})

export function flushAllStores(): void {
  settingsStore.flush()
}

export function getSettings<K extends keyof SettingsShape>(key: K): SettingsShape[K] {
  return settingsStore.get(key)
}

export function setSettings<K extends keyof SettingsShape>(key: K, value: SettingsShape[K]): void {
  settingsStore.set(key, value)
}