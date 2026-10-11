import { create } from 'zustand'
import type { DownloadsState } from '../../../shared/types'

interface DownloadsStore extends DownloadsState {
  applyState: (state: DownloadsState) => void
  clear: () => void
}

export const useDownloadsStore = create<DownloadsStore>()((set, get) => ({
  items: [],
  applyState: (state) => set({ items: state.items }),
  clear: () => void window.voyager.downloads.clear().then(get().applyState)
}))
