import { app, ipcMain, nativeTheme } from 'electron'
import { IpcChannels } from '../../shared/ipc-channels'
import type { AppVersionInfo, ThemeMode, ThemeState } from '../../shared/types'
import { getSettings, setSettings } from '../store/settings'

/** Minimal outbound channel: anything the main process pushes to the chrome. */
export interface IpcSender {
  send(channel: string, payload?: unknown): void
}

function currentThemeState(): ThemeState {
  return {
    mode: nativeTheme.themeSource,
    dark: nativeTheme.shouldUseDarkColors
  }
}

function applyThemeMode(mode: ThemeMode): ThemeState {
  nativeTheme.themeSource = mode
  setSettings('themeMode', mode)
  return currentThemeState()
}

export function registerIpcHandlers(send: IpcSender): void {
  // Apply the persisted theme before any renderer starts.
  const savedMode = getSettings('themeMode') ?? 'system'
  nativeTheme.themeSource = savedMode

  ipcMain.handle(IpcChannels.AppGetInfo, (): AppVersionInfo => ({
    app: app.getVersion(),
    electron: process.versions.electron ?? '',
    chrome: process.versions.chrome ?? '',
    node: process.versions.node ?? ''
  }))

  ipcMain.handle(IpcChannels.ThemeGet, (): ThemeState => currentThemeState())

  ipcMain.handle(IpcChannels.ThemeSet, (_event, mode: ThemeMode): void => {
    applyThemeMode(mode)
    send.send(IpcChannels.ThemeChanged, currentThemeState())
  })

  // Push live updates when 'system' changes as the OS theme flips.
  nativeTheme.on('updated', () => {
    send.send(IpcChannels.ThemeChanged, currentThemeState())
  })
}