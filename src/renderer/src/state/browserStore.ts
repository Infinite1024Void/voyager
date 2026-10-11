import { create } from 'zustand'
import type { BrowserState, NewTabRequest, TabState } from '../../../shared/types'

interface BrowserStore extends BrowserState {
  ready: boolean
  /** Replace store state with the latest snapshot from the main process. */
  applyState: (state: BrowserState) => void
  activateTab: (id: string) => void
  closeTab: (id: string) => void
  createTab: (request?: NewTabRequest) => void
  reorderTabs: (ids: string[]) => void
  pinToggle: (id: string) => void
  duplicateTab: (id: string) => void
  muteToggle: (id: string) => void
  closeOthers: (id: string) => void
  closeToRight: (id: string) => void
  goBack: () => void
  goForward: () => void
  reload: () => void
  stop: () => void
}

export const useBrowserStore = create<BrowserStore>()((set) => ({
  tabs: [],
  activeTabId: null,
  ready: false,

  applyState: (state) =>
    set({ tabs: state.tabs, activeTabId: state.activeTabId, ready: true }),

  activateTab: (id) => {
    void window.voyager.tabs.activate(id)
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
  goBack: () => {
    void window.voyager.navigation.back()
  },
  goForward: () => {
    void window.voyager.navigation.forward()
  },
  reload: () => {
    void window.voyager.navigation.reload()
  },
  stop: () => {
    void window.voyager.navigation.stop()
  }
}))

export function useActiveTab(): TabState | undefined {
  return useBrowserStore((state) =>
    state.tabs.find((tab) => tab.id === state.activeTabId)
  )
}