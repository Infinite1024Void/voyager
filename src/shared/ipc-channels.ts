/**
 * Single source of truth for IPC channel names. The chrome preload only
 * exposes these channels to the renderer, so anything not listed here can
 * never cross the bridge.
 */
export const IpcChannels = {
  AppGetInfo: 'app:get-info',
  SettingsOpen: 'settings:open',
  SettingsGet: 'settings:get',
  SettingsSet: 'settings:set',

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
  NavFindInPage: 'nav:find-in-page',
  NavStopFindInPage: 'nav:stop-find-in-page',
  NavZoomIn: 'nav:zoom-in',
  NavZoomOut: 'nav:zoom-out',
  NavZoomReset: 'nav:zoom-reset',
  NavPrint: 'nav:print',
  NavPrintToPdf: 'nav:print-to-pdf',
  DevToolsToggle: 'devtools:toggle',

  TabsReopenLastClosed: 'tabs:reopen-last-closed',

  BookmarksGetState: 'bookmarks:get-state',
  BookmarksAdd: 'bookmarks:add',
  BookmarksRemove: 'bookmarks:remove',
  BookmarksToggleBar: 'bookmarks:toggle-bar',
  BookmarksClear: 'bookmarks:clear',
  BookmarksStateChanged: 'bookmarks:state-changed',

  DownloadsGetState: 'downloads:get-state',
  DownloadsStateChanged: 'downloads:state-changed',
  DownloadsClear: 'downloads:clear',
  DownloadsPause: 'downloads:pause',
  DownloadsResume: 'downloads:resume',
  DownloadsCancel: 'downloads:cancel',

  HistoryGetState: 'history:get-state',
  HistoryStateChanged: 'history:state-changed',
  HistoryRecordVisit: 'history:record-visit',
  HistoryRemove: 'history:remove',
  HistoryClear: 'history:clear',

  UiFocusOmnibox: 'ui:focus-omnibox',
  UiFindInPage: 'ui:find-in-page',
  UiOpenTabSearch: 'ui:open-tab-search',
  UiOpenHistory: 'ui:open-history',
  UiOpenDownloads: 'ui:open-downloads',
  UiSetOverlayOpen: 'ui:set-overlay-open'
} as const

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]

export const ALL_IPC_CHANNELS: readonly IpcChannel[] = Object.values(IpcChannels)
