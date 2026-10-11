import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { ALL_IPC_CHANNELS, IpcChannels, type IpcChannel } from '../shared/ipc-channels'
import type { AppVersionInfo, ThemeMode, ThemeState, Unsubscribe } from '../shared/types'

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
  }
} as const

contextBridge.exposeInMainWorld('voyager', api)

export type VoyagerApi = typeof api