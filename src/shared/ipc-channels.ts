/**
 * Single source of truth for IPC channel names. The chrome preload only
 * exposes these channels to the renderer, so anything not listed here can
 * never cross the bridge.
 */
export const IpcChannels = {
  AppGetInfo: 'app:get-info',

  ThemeGet: 'theme:get',
  ThemeSet: 'theme:set',
  ThemeChanged: 'theme:changed'
} as const

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]

export const ALL_IPC_CHANNELS: readonly IpcChannel[] = Object.values(IpcChannels)