import { create } from 'zustand'
import type { BrowserState, NewTabRequest, TabState } from '../../../shared/types'
import { isNewTab, resolveInput } from '../../../shared/url'
import { DEFAULT_SEARCH_ENGINE, buildSearchUrl, type SearchEngineId } from '../../../shared/search'
import { focusOmnibox } from '../lib/shortcuts'

interface BrowserStore extends BrowserState {
  ready: boolean
  incognito: boolean
  searchEngine: SearchEngineId
  /** Replace store state with the latest snapshot from the main process. */
  applyState: (state: BrowserState) => void
  setIncognito: (incognito: boolean) => void
  setSearchEngine: (engine: SearchEngineId) => void
  activateTab: (id: string) => void
  activateNext: () => void
  activatePrevious: () => void
  activateTabAt: (index: number) => void
  closeTab: (id: string) => void
  createTab: (request?: NewTabRequest) => void
  reorderTabs: (ids: string[]) => void
  pinToggle: (id: string) => void
  duplicateTab: (id: string) => void
  muteToggle: (id: string) => void
  closeOthers: (id: string) => void
  closeToRight: (id: string) => void
  copyTabUrl: (id: string) => void
  reopenTab: () => void
  goBack: () => void
  goForward: () => void
  reload: () => void
  forceReload: () => void
  stop: () => void
  toggleDevTools: () => void
  /** Resolve omnibox input to a URL or search and navigate the active tab. */
  navigate: (input: string) => void
}

export const useBrowserStore = create<BrowserStore>()((set, get) => ({
  tabs: [],
  activeTabId: null,
  ready: false,
  incognito: false,
  searchEngine: DEFAULT_SEARCH_ENGINE,

  applyState: (state) => set({ tabs: state.tabs, activeTabId: state.activeTabId, ready: true }),

  setIncognito: (incognito) => set({ incognito }),
  setSearchEngine: (engine) => set({ searchEngine: engine }),

  activateTab: (id) => {
    void window.voyager.tabs.activate(id)
  },
  activateNext: () => {
    const state = get()
    if (state.tabs.length === 0) return
    const current = state.tabs.findIndex((tab) => tab.id === state.activeTabId)
    state.activateTab(state.tabs[(current + 1) % state.tabs.length].id)
  },
  activatePrevious: () => {
    const state = get()
    if (state.tabs.length === 0) return
    const current = state.tabs.findIndex((tab) => tab.id === state.activeTabId)
    state.activateTab(state.tabs[(current - 1 + state.tabs.length) % state.tabs.length].id)
  },
  activateTabAt: (index) => {
    const state = get()
    const tab = state.tabs[Math.min(Math.max(index, 0), state.tabs.length - 1)]
    if (tab) state.activateTab(tab.id)
  },
  closeTab: (id) => {
    void window.voyager.tabs.close(id)
  },
  createTab: (request) => {
    void window.voyager.tabs.create(request)
    if (!request?.url || isNewTab(request.url)) {
      focusOmnibox()
    }
  },
  reorderTabs: (ids) => {
    void window.voyager.tabs.reorder(ids)
  },
  pinToggle: (id) => {
    void window.voyager.tabs.pinToggle(id)
  },
  duplicateTab: (id) => {
    void window.voyager.tabs.duplicate(id)
  },
  muteToggle: (id) => {
    void window.voyager.tabs.muteToggle(id)
  },
  closeOthers: (id) => {
    void window.voyager.tabs.closeOthers(id)
  },
  closeToRight: (id) => {
    void window.voyager.tabs.closeToRight(id)
  },
  copyTabUrl: (id) => {
    void window.voyager.tabs.copyUrl(id)
  },
  reopenTab: () => {
    void window.voyager.tabs.reopenLastClosed()
  },
  goBack: () => {
    void window.voyager.navigation.back()
  },
  goForward: () => {
    void window.voyager.navigation.forward()
  },
  reload: () => {
    void window.voyager.navigation.reload()
  },
  forceReload: () => {
    void window.voyager.navigation.forceReload()
  },
  stop: () => {
    void window.voyager.navigation.stop()
  },
  toggleDevTools: () => {
    void window.voyager.navigation.toggleDevTools()
  },
  navigate: (input) => {
    // Incognito contexts scope the search setting to the default engine.
    const state = get()
    const engine = state.incognito ? DEFAULT_SEARCH_ENGINE : state.searchEngine
    const url = resolveInput(input, (query) => buildSearchUrl(engine, query))
    void window.voyager.navigation.go(url)
  }
}))

export function useActiveTab(): TabState | undefined {
  return useBrowserStore((state) => state.tabs.find((tab) => tab.id === state.activeTabId))
}

/**
 * Search engine that applies right now: the persisted preference, or the
 * default engine when the window is in incognito mode.
 */
export function useScopedSearchEngine(): SearchEngineId {
  const searchEngine = useBrowserStore((state) => state.searchEngine)
  const incognito = useBrowserStore((state) => state.incognito)
  return incognito ? DEFAULT_SEARCH_ENGINE : searchEngine
}
