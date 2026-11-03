import { app, BrowserWindow, clipboard, ipcMain, nativeTheme, session } from 'electron'
import { IpcChannels } from '../../shared/ipc-channels'
import { isPermissionKind, isPermissionRequestChoice } from '../../shared/permissions'
import type {
  AppVersionInfo,
  ClearBrowsingDataOptions,
  NewBookmarkInput,
  NewTabRequest,
  PermissionKind,
  PermissionRequestChoice,
  SettingsTarget,
  ThemeMode,
  ThemeState,
  UserPreferences
} from '../../shared/types'
import {
  addBookmark,
  clearBookmarks,
  currentBookmarksState,
  removeBookmark,
  toggleBookmarksBar
} from '../bookmarks/bookmarks'
import {
  clearHistory,
  currentHistoryState,
  publishHistory,
  recordVisit,
  removeHistory
} from '../history/history'
import {
  clearSitePermissions,
  configurePermissionPromptRouter,
  currentSitePermissions,
  removeSitePermissions,
  respondToPermissionRequest,
  sitePermissionsForOrigin
} from '../permissions/permissions'
import type { WindowController } from '../window/WindowController'
import { openSettingsWindow } from '../window/settingsWindow'
import { getSettings, setSettings } from '../store'
import {
  cancelDownload,
  clearDownloads,
  currentDownloadsState,
  downloadUrl,
  openDownloadFolder,
  pauseDownload,
  publishDownloads,
  removeDownload,
  resumeDownload
} from '../downloads/downloads'

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

function userPreferences(): UserPreferences {
  return {
    clearHistory: (getSettings('clearHistory', true) as boolean) !== false,
    clearDownloads: (getSettings('clearDownloads', true) as boolean) !== false,
    clearBookmarks: getSettings('clearBookmarks', false) === true,
    clearCookies: (getSettings('clearCookies', true) as boolean) !== false,
    clearLocalStorage: (getSettings('clearLocalStorage', true) as boolean) !== false,
    clearIndexedDb: (getSettings('clearIndexedDb', true) as boolean) !== false,
    clearCache: (getSettings('clearCache', true) as boolean) !== false,
    clearSitePermissions: (getSettings('clearSitePermissions', true) as boolean) !== false,
    openDownloadsWhenDone: getSettings('openDownloadsWhenDone', false) === true
  }
}

export function registerIpcHandlers(context: IpcContext): void {
  // Apply the persisted theme before any renderer starts.
  const savedMode = (getSettings('themeMode') as ThemeMode | undefined) ?? 'system'
  nativeTheme.themeSource = savedMode

  configurePermissionPromptRouter((webContents) => {
    const window = context.getWindow()
    if (!window) return null
    return {
      tabId: webContents ? window.tabIdForWebContents(webContents) : null,
      send: (channel, payload) => window.sendToChrome(channel, payload)
    }
  })

  ipcMain.handle(IpcChannels.AppGetInfo, (): AppVersionInfo => ({
    app: app.getVersion(),
    electron: process.versions.electron ?? '',
    chrome: process.versions.chrome ?? '',
    node: process.versions.node ?? ''
  }))

  ipcMain.handle(IpcChannels.SettingsOpen, (_event, target?: SettingsTarget) =>
    openSettingsWindow(target)
  )

  ipcMain.handle(IpcChannels.SettingsGet, () => userPreferences())

  const supportedSettings = new Set<keyof UserPreferences>([
    'clearHistory',
    'clearDownloads',
    'clearBookmarks',
    'clearCookies',
    'clearLocalStorage',
    'clearIndexedDb',
    'clearCache',
    'clearSitePermissions',
    'openDownloadsWhenDone'
  ])

  ipcMain.handle(IpcChannels.SettingsSet, (_event, key: keyof UserPreferences, value: boolean) => {
    if (!supportedSettings.has(key)) {
      throw new Error(`Unsupported setting: ${key}`)
    }
    setSettings(key, value)
    return userPreferences()
  })

  /* ---- theme ----------------------------------------------------------- */

  ipcMain.handle(IpcChannels.ThemeGet, (): ThemeState => currentThemeState())

  ipcMain.handle(IpcChannels.ThemeSet, (_event, mode: ThemeMode): ThemeState => {
    const state = applyThemeMode(mode)
    context.send(IpcChannels.ThemeChanged, state)
    return state
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
    const tab = context
      .getWindow()
      ?.tabs.snapshot()
      .tabs.find((tab) => tab.id === id)
    if (tab) clipboard.writeText(tab.url)
    return tab?.url
  })

  /* ---- navigation ------------------------------------------------------ */

  ipcMain.handle(IpcChannels.NavBack, () => context.getWindow()?.tabs.goBack())
  ipcMain.handle(IpcChannels.NavForward, () => context.getWindow()?.tabs.goForward())
  ipcMain.handle(IpcChannels.NavReload, () => context.getWindow()?.tabs.reload())
  ipcMain.handle(IpcChannels.NavStop, () => context.getWindow()?.tabs.stop())
  ipcMain.handle(IpcChannels.NavGo, (_event, url: string) =>
    context.getWindow()?.tabs.navigate(url)
  )
  ipcMain.handle(IpcChannels.NavForceReload, () => context.getWindow()?.tabs.reloadIgnoringCache())
  ipcMain.handle(IpcChannels.NavFindInPage, (_event, query: string, forward?: boolean) =>
    context.getWindow()?.tabs.findInPage(query, forward ?? true)
  )
  ipcMain.handle(IpcChannels.NavStopFindInPage, () => context.getWindow()?.tabs.stopFindInPage())
  ipcMain.handle(IpcChannels.NavZoomIn, () => context.getWindow()?.tabs.zoomIn())
  ipcMain.handle(IpcChannels.NavZoomOut, () => context.getWindow()?.tabs.zoomOut())
  ipcMain.handle(IpcChannels.NavZoomReset, () => context.getWindow()?.tabs.zoomReset())
  ipcMain.handle(IpcChannels.NavPrint, () => context.getWindow()?.tabs.print())
  ipcMain.handle(IpcChannels.NavPrintToPdf, async () => {
    const buf = await context.getWindow()?.tabs.printToPdf()
    return buf ? buf.toString('base64') : null
  })
  ipcMain.handle(IpcChannels.DevToolsToggle, () => context.getWindow()?.tabs.toggleDevTools())

  ipcMain.handle(IpcChannels.TabsReopenLastClosed, () =>
    context.getWindow()?.tabs.reopenLastClosed()
  )

  /* ---- bookmarks ------------------------------------------------------ */

  ipcMain.handle(IpcChannels.BookmarksGetState, () => currentBookmarksState())

  ipcMain.handle(IpcChannels.BookmarksAdd, (_event, input: NewBookmarkInput) =>
    addBookmark(
      input,
      (state) => context.send(IpcChannels.BookmarksStateChanged, state),
      (visible) => context.getWindow()?.setBookmarksBarVisible(visible)
    )
  )

  ipcMain.handle(IpcChannels.BookmarksRemove, (_event, id: string) =>
    removeBookmark(id, (state) => context.send(IpcChannels.BookmarksStateChanged, state))
  )

  ipcMain.handle(IpcChannels.BookmarksClear, () =>
    clearBookmarks((state) => context.send(IpcChannels.BookmarksStateChanged, state))
  )

  ipcMain.handle(IpcChannels.BookmarksToggleBar, () =>
    toggleBookmarksBar(
      (state) => context.send(IpcChannels.BookmarksStateChanged, state),
      (visible) => context.getWindow()?.setBookmarksBarVisible(visible)
    )
  )

  /* ---- site permissions ------------------------------------------------ */

  const publishPermissions = (): ReturnType<typeof currentSitePermissions> => {
    const state = currentSitePermissions()
    context.send(IpcChannels.PermissionsStateChanged, state)
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(IpcChannels.PermissionsStateChanged, state)
    }
    return state
  }

  ipcMain.handle(IpcChannels.PermissionsGetState, () => currentSitePermissions())

  ipcMain.handle(IpcChannels.PermissionsGetForOrigin, (_event, origin: string) =>
    typeof origin === 'string' ? sitePermissionsForOrigin(origin) : { decisions: [] }
  )

  ipcMain.handle(
    IpcChannels.PermissionsRemove,
    (_event, origin: string, kind?: PermissionKind) => {
      if (typeof origin !== 'string') throw new Error('Invalid permission origin')
      if (kind !== undefined && !isPermissionKind(kind)) {
        throw new Error(`Invalid permission kind: ${String(kind)}`)
      }
      const changed = removeSitePermissions(origin, kind)
      return changed ? publishPermissions() : currentSitePermissions()
    }
  )

  ipcMain.handle(IpcChannels.PermissionsClear, () => {
    const changed = clearSitePermissions()
    return changed ? publishPermissions() : currentSitePermissions()
  })

  ipcMain.handle(
    IpcChannels.PermissionsRespond,
    (_event, id: string, choice: PermissionRequestChoice) => {
      if (typeof id !== 'string' || !isPermissionRequestChoice(choice)) {
        throw new Error('Invalid permission response')
      }
      const result = respondToPermissionRequest(id, choice)
      if (result.changed) publishPermissions()
      return result.handled
    }
  )

  /* ---- browsing data --------------------------------------------------- */

  type StorageKind = 'cookies' | 'localstorage' | 'indexdb'

  ipcMain.handle(
    IpcChannels.BrowsingDataClear,
    async (_event, options: ClearBrowsingDataOptions): Promise<void> => {
      if (!options || typeof options !== 'object') {
        throw new Error('Invalid browsing data options')
      }

      const storages: StorageKind[] = []
      if (options.cookies === true) storages.push('cookies')
      if (options.localStorage === true) storages.push('localstorage')
      if (options.indexedDb === true) storages.push('indexdb')

      if (storages.length > 0) {
        await session.defaultSession.clearStorageData({ storages })
      }
      if (options.cache === true) {
        await session.defaultSession.clearCache()
      }
      if (options.sitePermissions === true && clearSitePermissions()) {
        publishPermissions()
      }
    }
  )

  /* ---- history --------------------------------------------------------- */

  ipcMain.handle(IpcChannels.HistoryGetState, () => currentHistoryState())

  ipcMain.handle(
    IpcChannels.HistoryRecordVisit,
    (_event, visit: { url: string; title: string }) => {
      recordVisit(visit)
      return publishHistory((state) => context.send(IpcChannels.HistoryStateChanged, state))
    }
  )

  ipcMain.handle(IpcChannels.HistoryRemove, (_event, id: string) => {
    removeHistory(id)
    return publishHistory((state) => context.send(IpcChannels.HistoryStateChanged, state))
  })

  ipcMain.handle(IpcChannels.HistoryClear, () => {
    clearHistory()
    return publishHistory((state) => context.send(IpcChannels.HistoryStateChanged, state))
  })

  /* ---- downloads ------------------------------------------------------ */

  ipcMain.handle(IpcChannels.DownloadsGetState, () => currentDownloadsState())

  ipcMain.handle(IpcChannels.DownloadsClear, () => {
    clearDownloads()
    return publishDownloads((state) => context.send(IpcChannels.DownloadsStateChanged, state))
  })

  const publishDownloadsState = (): ReturnType<typeof publishDownloads> =>
    publishDownloads((state) => context.send(IpcChannels.DownloadsStateChanged, state))

  ipcMain.handle(IpcChannels.DownloadsPause, (_event, id: string) => {
    pauseDownload(id)
    return publishDownloadsState()
  })

  ipcMain.handle(IpcChannels.DownloadsResume, (_event, id: string) => {
    resumeDownload(id)
    return publishDownloadsState()
  })

  ipcMain.handle(IpcChannels.DownloadsCancel, (_event, id: string) => {
    cancelDownload(id)
    return publishDownloadsState()
  })

  ipcMain.handle(IpcChannels.DownloadsRemove, (_event, id: string) => {
    removeDownload(id)
    return publishDownloadsState()
  })

  ipcMain.handle(IpcChannels.DownloadsCopyUrl, (_event, id: string) => {
    const url = downloadUrl(id)
    if (url) clipboard.writeText(url)
    return url
  })

  ipcMain.handle(IpcChannels.DownloadsOpenFolder, (_event, id: string) => openDownloadFolder(id))

  /* ---- chrome overlay -------------------------------------------------- */

  // The chrome view is normally clipped to its strip height; while a dropdown,
  // palette or menu is open it expands over the page so overlays are not cut off.
  ipcMain.handle(IpcChannels.UiOpenDownloads, () =>
    context.getWindow()?.sendToChrome(IpcChannels.UiOpenDownloads)
  )
  ipcMain.handle(IpcChannels.UiSetOverlayOpen, (_event, open: boolean) =>
    context.getWindow()?.setOverlayOpen(open)
  )
}
