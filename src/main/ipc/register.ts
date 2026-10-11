import { app, ipcMain, nativeTheme } from 'electron'
import { IpcChannels } from '../../shared/ipc-channels'
import type { AppVersionInfo, ThemeMode } from '../../shared/types'

/** Minimal outbound channel: anything the main process pushes to the chrome. */
export interface IpcSender {
  send(channel: string, payload?: unknown): void
}

let currentThemeMode: ThemeMode = 'system'

function setThemeMode(mode: ThemeMode, send: IpcSender): void {
  currentThemeMode = mode
  nativeTheme.themeSource = mode
  send.send(IpcChannels.ThemeChanged, mode)
}

export function registerIpcHandlers(send: IpcSender): void {
  ipcMain.handle(IpcChannels.AppGetInfo, (): AppVersionInfo => ({
    app: app.getVersion(),
    electron: process.versions.electron ?? '',
    chrome: process.versions.chrome ?? '',
    node: process.versions.node ?? ''
  }))

  ipcMain.handle(IpcChannels.ThemeGet, (): ThemeMode => currentThemeMode)

  ipcMain.handle(IpcChannels.ThemeSet, (_event, mode: ThemeMode): void => {
    setThemeMode(mode, send)
  })
}