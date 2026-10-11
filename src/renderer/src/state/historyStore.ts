import { create } from 'zustand'
import type { HistoryEntry, HistoryState } from '../../../shared/types'

interface HistoryStore extends HistoryState {
  applyState: (state: HistoryState) => void
  remove: (id: string) => void
  clear: () => void
}

export const useHistoryStore = create<HistoryStore>()((set, get) => ({
  entries: [],

  applyState: (state) => set({ entries: state.entries }),

  remove: (id) => {
    void window.voyager.history.remove(id).then(get().applyState)
  },

  clear: () => {
    void window.voyager.history.clear().then(get().applyState)
  }
}))

/** Search history entries by query (url or title). */
export function searchHistory(entries: HistoryEntry[], query: string): HistoryEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return entries
  return entries.filter(
    (entry) => entry.title.toLowerCase().includes(q) || entry.url.toLowerCase().includes(q)
  )
}
