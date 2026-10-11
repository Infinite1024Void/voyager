import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { ALL_IPC_CHANNELS, IpcChannels, type IpcChannel } from '../shared/ipc-channels'
import type { AppVersionInfo, BrowserState, NewTabRequest, ThemeMode, ThemeState, Unsubscribe } from '../shared/types'

const allowedChannels = new Set<string>(ALL_IPC_CHANNELS)

function subscribe<TPayload>(
  channel: IpcChannel,
  listener: (payload: TPayload) => void
): Unsubscribe {
  if (!allowedChannels.has(channel)) {
    throw new Error(`Unauthorized IPC channel: ${channel}`)
  }
  const wrapped = (_event: IpcRendererEvent, payload: TPayload): void => {
    listener(payload)
  }
  ipcRenderer.on(channel, wrapped)
  return () => {
    ipcRenderer.removeListener(channel, wrapped)
  }
}

const api = {
  /** Read-only platform/version info resolved in the main process. */
  appInfo: (): Promise<AppVersionInfo> => ipcRenderer.invoke(IpcChannels.AppGetInfo),

  theme: {
    get: (): Promise<ThemeState> => ipcRenderer.invoke(IpcChannels.ThemeGet),
    set: (mode: ThemeMode): Promise<void> => ipcRenderer.invoke(IpcChannels.ThemeSet, mode),
    onChanged: (listener: (state: ThemeState) => void): Unsubscribe =>
      subscribe<ThemeState>(IpcChannels.ThemeChanged, listener)
  },

  tabs: {
    getState: (): Promise<BrowserState> => ipcRenderer.invoke(IpcChannels.TabsGetState),
    create: (request?: NewTabRequest): Promise<string> =>
      ipcRenderer.invoke(IpcChannels.TabsCreate, request),
    close: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.TabsClose, id),
    activate: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.TabsActivate, id),
    reorder: (ids: string[]): Promise<void> => ipcRenderer.invoke(IpcChannels.TabsReorder, ids),
    pinToggle: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.TabsPinToggle, id),
    duplicate: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.TabsDuplicate, id),
    muteToggle: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.TabsMuteToggle, id),
    closeOthers: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.TabsCloseOthers, id),
    closeToRight: (id: string): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.TabsCloseToRight, id),
    copyUrl: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.TabsCopyUrl, id),
    onStateChanged: (listener: (state: BrowserState) => void): Unsubscribe =>
      subscribe<BrowserState>(IpcChannels.TabsStateChanged, listener)
  },

  navigation: {
    back: (): Promise<void> => ipcRenderer.invoke(IpcChannels.NavBack),
    forward: (): Promise<void> => ipcRenderer.invoke(IpcChannels.NavForward),
    reload: (): Promise<void> => ipcRenderer.invoke(IpcChannels.NavReload),
    stop: (): Promise<void> => ipcRenderer.invoke(IpcChannels.NavStop),
    go: (url: string): Promise<void> => ipcRenderer.invoke(IpcChannels.NavGo, url)
  }
} as const

contextBridge.exposeInMainWorld('voyager', api)

export type VoyagerApi = typeof api