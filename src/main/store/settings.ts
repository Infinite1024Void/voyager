import { app } from 'electron'
import { join } from 'node:path'
import type { ThemeMode } from '../../shared/types'
import { readJsonFile, writeJsonFile } from './jsonFile'

interface SettingsShape {
  themeMode?: ThemeMode
}

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

let cache: SettingsShape | null = null

function load(): SettingsShape {
  if (cache === null) {
    cache = readJsonFile<SettingsShape>(settingsPath(), {})
  }
  return cache
}

export function getSettings<K extends keyof SettingsShape>(key: K): SettingsShape[K] {
  return load()[key]
}

export function setSettings<K extends keyof SettingsShape>(key: K, value: SettingsShape[K]): void {
  const current = load()
  current[key] = value
  cache = current
  writeJsonFile(settingsPath(), current)
}