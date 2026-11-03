import { create } from 'zustand'
import type { BookmarksState } from '../../../shared/types'

interface BookmarksStore extends BookmarksState {
  applyState: (state: BookmarksState) => void
  addBookmark: (title: string, url: string, favicon?: string | null) => void
  removeBookmark: (id: string) => void
  toggleBar: () => void
}

export const useBookmarksStore = create<BookmarksStore>()((set, get) => ({
  items: [],
  barVisible: false,

  applyState: (state) => set({ items: state.items, barVisible: state.barVisible }),

  addBookmark: (title, url, favicon) => {
    void window.voyager.bookmarks.add({ title, url, favicon }).then(get().applyState)
  },
  removeBookmark: (id) => {
    void window.voyager.bookmarks.remove(id).then(get().applyState)
  },
  toggleBar: () => {
    void window.voyager.bookmarks.toggleBar().then(get().applyState)
  }
}))

/** Whether the given URL is already bookmarked. */
export function useIsBookmarked(url: string): boolean {
  return useBookmarksStore((state) => state.items.some((item) => item.url === url))
}