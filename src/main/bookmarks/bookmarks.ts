import { randomUUID } from 'node:crypto'
import type { BookmarksState, NewBookmarkInput } from '../../shared/types'
import { bookmarksStore, getSettings, setSettings } from '../store'

/**
 * Bookmarks live in the main process (persisted to userData) and are
 * broadcast to the chrome renderer whenever they change. The bar's
 * visibility is a settings flag that also adjusts the chrome view height.
 */

function resolveBookmarksBarVisibility(): boolean {
  const stored = getSettings('bookmarksBarVisible')
  if (stored === undefined) {
    const visible = bookmarksStore.get('items').length > 0
    if (visible) setSettings('bookmarksBarVisible', true)
    return visible
  }
  return stored === true
}

export function currentBookmarksState(): BookmarksState {
  return {
    items: bookmarksStore.get('items'),
    barVisible: resolveBookmarksBarVisibility()
  }
}

/** Add a bookmark (dedupes by URL) and return the resulting state. */
export function addBookmark(
  input: NewBookmarkInput,
  broadcast: (state: BookmarksState) => void,
  setBarExtent?: (visible: boolean) => void
): BookmarksState {
  const items = bookmarksStore.get('items')
  let added = false
  if (!items.some((item) => item.url === input.url)) {
    bookmarksStore.update('items', (list) => [
      ...list,
      {
        id: randomUUID(),
        title: input.title.trim() || input.url,
        url: input.url,
        favicon: input.favicon ?? null,
        createdAt: Date.now()
      }
    ])
    added = true
  } else if (input.favicon) {
    // Keep an existing bookmark's icon fresh.
    bookmarksStore.update('items', (list) =>
      list.map((item) =>
        item.url === input.url ? { ...item, favicon: input.favicon ?? item.favicon } : item
      )
    )
  }

  if (added && !resolveBookmarksBarVisibility()) {
    setSettings('bookmarksBarVisible', true)
    setBarExtent?.(true)
  }

  return publish(broadcast)
}

export function removeBookmark(
  id: string,
  broadcast: (state: BookmarksState) => void
): BookmarksState {
  bookmarksStore.update('items', (list) => list.filter((item) => item.id !== id))
  return publish(broadcast)
}

export function clearBookmarks(broadcast: (state: BookmarksState) => void): BookmarksState {
  bookmarksStore.set('items', [])
  return publish(broadcast)
}

/** Flip bar visibility; persists it and adjusts the chrome height. */
export function toggleBookmarksBar(
  broadcast: (state: BookmarksState) => void,
  setBarExtent: (visible: boolean) => void
): BookmarksState {
  const visible = !(getSettings('bookmarksBarVisible') ?? false)
  setSettings('bookmarksBarVisible', visible)
  setBarExtent(visible)
  return publish(broadcast)
}

function publish(broadcast: (state: BookmarksState) => void): BookmarksState {
  const state = currentBookmarksState()
  broadcast(state)
  return state
}
