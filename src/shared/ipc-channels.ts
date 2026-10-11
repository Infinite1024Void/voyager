/**
 * Single source of truth for IPC channel names. The chrome preload only
 * exposes these channels to the renderer, so anything not listed here can
 * never cross the bridge.
 */
export const IpcChannels = {
  AppGetInfo: 'app:get-info',

  ThemeGet: 'theme:get',
  ThemeSet: 'theme:set',
  ThemeChanged: 'theme:changed',

  TabsGetState: 'tabs:get-state',
  TabsStateChanged: 'tabs:state-changed',
  TabsCreate: 'tabs:create',
  TabsClose: 'tabs:close',
  TabsActivate: 'tabs:activate',
  TabsReorder: 'tabs:reorder',
  TabsPinToggle: 'tabs:pin-toggle',
  TabsDuplicate: 'tabs:duplicate',
  TabsMuteToggle: 'tabs:mute-toggle',
  TabsCloseOthers: 'tabs:close-others',
  TabsCloseToRight: 'tabs:close-to-right',
  TabsCopyUrl: 'tabs:copy-url',

  NavBack: 'nav:back',
  NavForward: 'nav:forward',
  NavReload: 'nav:reload',
  NavStop: 'nav:stop',
  NavGo: 'nav:go',
  NavForceReload: 'nav:force-reload',

  TabsReopenLastClosed: 'tabs:reopen-last-closed',

  BookmarksGetState: 'bookmarks:get-state',
  BookmarksAdd: 'bookmarks:add',
  BookmarksRemove: 'bookmarks:remove',
  BookmarksToggleBar: 'bookmarks:toggle-bar',
  BookmarksStateChanged: 'bookmarks:state-changed',

  UiFocusOmnibox: 'ui:focus-omnibox',
  UiOpenTabSearch: 'ui:open-tab-search',
  UiSetOverlayOpen: 'ui:set-overlay-open'
} as const

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]

export const ALL_IPC_CHANNELS: readonly IpcChannel[] = Object.values(IpcChannels)