import { join } from 'node:path'
import { BrowserWindow } from 'electron'
import { SETTINGS_URL } from '../../shared/constants'

let settingsWindow: BrowserWindow | null = null

/** Open the settings window, or focus it when it is already open. */
export function openSettingsWindow(): void {
  const existing = settingsWindow
  if (existing && !existing.isDestroyed()) {
    if (existing.isMinimized()) existing.restore()
    existing.focus()
    return
  }

  const win = new BrowserWindow({
    width: 900,
    height: 650,
    title: 'Settings - Voyager',
    backgroundColor: '#1a1b22',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  win.on('closed', () => {
    if (settingsWindow === win) settingsWindow = null
  })

  settingsWindow = win
  void win.loadURL(SETTINGS_URL)
}
