import { create } from 'zustand'
import type { BrowserState, NewTabRequest, TabState } from '../../../shared/types'
import { resolveInput } from '../../../shared/url'
import { DEFAULT_SEARCH_ENGINE, buildSearchUrl } from '../../../shared/search'

interface BrowserStore extends BrowserState {
  ready: boolean
  /** Replace store state with the latest snapshot from the main process. */
  applyState: (state: BrowserState) => void
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
  /** Resolve omnibox input to a URL or search and navigate the active tab. */
  navigate: (input: string) => void
}

export const useBrowserStore = create<BrowserStore>()((set, get) => ({
  tabs: [],
  activeTabId: null,
  ready: false,

  applyState: (state) =>
    set({ tabs: state.tabs, activeTabId: state.activeTabId, ready: true }),

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
  navigate: (input) => {
    const url = resolveInput(input, (query) =>
      buildSearchUrl(DEFAULT_SEARCH_ENGINE, query)
    )
    void window.voyager.navigation.go(url)
  }
}))

export function useActiveTab(): TabState | undefined {
  return useBrowserStore((state) =>
    state.tabs.find((tab) => tab.id === state.activeTabId)
  )
}