import { create } from 'zustand'

interface UiStore {
  tabSearchOpen: boolean
  openTabSearch: () => void
  closeTabSearch: () => void
}

export const useUiStore = create<UiStore>()((set) => ({
  tabSearchOpen: false,
  openTabSearch: () => set({ tabSearchOpen: true }),
  closeTabSearch: () => set({ tabSearchOpen: false })
}))