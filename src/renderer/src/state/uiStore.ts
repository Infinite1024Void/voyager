import { create } from 'zustand'

interface UiStore {
  tabSearchOpen: boolean
  openTabSearch: () => void
  closeTabSearch: () => void
  settingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
  bookmarksManagerOpen: boolean
  openBookmarksManager: () => void
  closeBookmarksManager: () => void
}

export const useUiStore = create<UiStore>()((set) => ({
  tabSearchOpen: false,
  openTabSearch: () => set({ tabSearchOpen: true }),
  closeTabSearch: () => set({ tabSearchOpen: false }),
  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  bookmarksManagerOpen: false,
  openBookmarksManager: () => set({ bookmarksManagerOpen: true }),
  closeBookmarksManager: () => set({ bookmarksManagerOpen: false })
}))
