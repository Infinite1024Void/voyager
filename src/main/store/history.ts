import type { HistoryEntry } from '../../shared/types'

/** Shape persisted on disk for browsing history. */
export interface HistoryShape {
  entries: HistoryEntry[]
}
