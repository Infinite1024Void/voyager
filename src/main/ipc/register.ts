import { app, clipboard, ipcMain, nativeTheme } from 'electron'
import { IpcChannels } from '../../shared/ipc-channels'
import type {
  AppVersionInfo,
  NewBookmarkInput,
  NewTabRequest,
  ThemeMode,
  ThemeState
} from '../../shared/types'
import { addBookmark, currentBookmarksState, removeBookmark, toggleBookmarksBar } from '../bookmarks/bookmarks'
import type { WindowController } from '../window/WindowController'
import { getSettings, setSettings } from '../store'

/** Outbound channel + access to the live window so handlers can act on it. */
export interface IpcContext {
  send(channel: string, payload?: unknown): void
  getWindow(): WindowController | null
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

export function registerIpcHandlers(context: IpcContext): void {
  // Apply the persisted theme before any renderer starts.
  const savedMode = getSettings('themeMode') ?? 'system'
  nativeTheme.themeSource = savedMode

  ipcMain.handle(IpcChannels.AppGetInfo, (): AppVersionInfo => ({
    app: app.getVersion(),
    electron: process.versions.electron ?? '',
    chrome: process.versions.chrome ?? '',
    node: process.versions.node ?? ''
  }))

  /* ---- theme ----------------------------------------------------------- */

  ipcMain.handle(IpcChannels.ThemeGet, (): ThemeState => currentThemeState())

  ipcMain.handle(IpcChannels.ThemeSet, (_event, mode: ThemeMode): void => {
    applyThemeMode(mode)
    context.send(IpcChannels.ThemeChanged, currentThemeState())
  })

  // Push live updates when 'system' changes as the OS theme flips.
  nativeTheme.on('updated', () => {
    context.send(IpcChannels.ThemeChanged, currentThemeState())
  })

  /* ---- tabs ------------------------------------------------------------ */

  ipcMain.handle(IpcChannels.TabsGetState, () => context.getWindow()?.tabs.snapshot() ?? null)

  ipcMain.handle(IpcChannels.TabsCreate, (_event, request: NewTabRequest) =>
    context.getWindow()?.tabs.create(request)
  )

  ipcMain.handle(IpcChannels.TabsClose, (_event, id: string) => context.getWindow()?.tabs.close(id))

  ipcMain.handle(IpcChannels.TabsActivate, (_event, id: string) =>
    context.getWindow()?.tabs.activate(id)
  )

  ipcMain.handle(IpcChannels.TabsReorder, (_event, ids: string[]) =>
    context.getWindow()?.tabs.reorder(ids)
  )

  ipcMain.handle(IpcChannels.TabsPinToggle, (_event, id: string) =>
    context.getWindow()?.tabs.pinToggle(id)
  )

  ipcMain.handle(IpcChannels.TabsDuplicate, (_event, id: string) =>
    context.getWindow()?.tabs.duplicate(id)
  )

  ipcMain.handle(IpcChannels.TabsMuteToggle, (_event, id: string) =>
    context.getWindow()?.tabs.muteToggle(id)
  )

  ipcMain.handle(IpcChannels.TabsCloseOthers, (_event, id: string) =>
    context.getWindow()?.tabs.closeOthers(id)
  )

  ipcMain.handle(IpcChannels.TabsCloseToRight, (_event, id: string) =>
    context.getWindow()?.tabs.closeToRight(id)
  )

  ipcMain.handle(IpcChannels.TabsCopyUrl, (_event, id: string) => {
    const tab = context.getWindow()?.tabs.snapshot().tabs.find((tab) => tab.id === id)
    if (tab) clipboard.writeText(tab.url)
  })

  /* ---- navigation ------------------------------------------------------ */

  ipcMain.handle(IpcChannels.NavBack, () => context.getWindow()?.tabs.goBack())
  ipcMain.handle(IpcChannels.NavForward, () => context.getWindow()?.tabs.goForward())
  ipcMain.handle(IpcChannels.NavReload, () => context.getWindow()?.tabs.reload())
  ipcMain.handle(IpcChannels.NavStop, () => context.getWindow()?.tabs.stop())
  ipcMain.handle(IpcChannels.NavGo, (_event, url: string) => context.getWindow()?.tabs.navigate(url))
  ipcMain.handle(IpcChannels.NavForceReload, () => context.getWindow()?.tabs.reloadIgnoringCache())

  ipcMain.handle(IpcChannels.TabsReopenLastClosed, () => context.getWindow()?.tabs.reopenLastClosed())

  /* ---- bookmarks ------------------------------------------------------ */

  ipcMain.handle(IpcChannels.BookmarksGetState, () => currentBookmarksState())

  ipcMain.handle(IpcChannels.BookmarksAdd, (_event, input: NewBookmarkInput) =>
    addBookmark(input, (state) => context.send(IpcChannels.BookmarksStateChanged, state))
  )

  ipcMain.handle(IpcChannels.BookmarksRemove, (_event, id: string) =>
    removeBookmark(id, (state) => context.send(IpcChannels.BookmarksStateChanged, state))
  )

  ipcMain.handle(IpcChannels.BookmarksToggleBar, () =>
    toggleBookmarksBar(
      (state) => context.send(IpcChannels.BookmarksStateChanged, state),
      (visible) => context.getWindow()?.setBookmarksBarVisible(visible)
    )
  )
}