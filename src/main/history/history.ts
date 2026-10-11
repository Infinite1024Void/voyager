import { randomUUID } from 'node:crypto'
import type { HistoryEntry, HistoryState } from '../../shared/types'
import { historyStore } from '../store'

export function currentHistoryState(): HistoryState {
  const entries = historyStore.get('entries')
  // Return most recent first.
  return { entries: [...entries].sort((a, b) => b.visitedAt - a.visitedAt) }
}

export function recordVisit(input: { url: string; title: string }): HistoryEntry {
  const url = input.url
  const title = input.title || url
  const entries = historyStore.get('entries')
  const existing = entries.find((item) => item.url === url)

  if (existing) {
    existing.visitCount += 1
    existing.visitedAt = Date.now()
    existing.title = title
    historyStore.set('entries', entries)
    return existing
  }

  const entry: HistoryEntry = {
    id: randomUUID(),
    url,
    title,
    visitedAt: Date.now(),
    visitCount: 1
  }
  historyStore.update('entries', (list) => [...list, entry])
  return entry
}

export function removeHistory(id: string): void {
  historyStore.update('entries', (list) => list.filter((item) => item.id !== id))
}

export function clearHistory(): void {
  historyStore.set('entries', [])
}

export function publishHistory(broadcast: (state: HistoryState) => void): HistoryState {
  const state = currentHistoryState()
  broadcast(state)
  return state
}
