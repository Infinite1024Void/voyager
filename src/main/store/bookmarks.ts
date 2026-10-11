import type { BookmarkItem } from '../../shared/types'

/** Shape persisted on disk for the bookmarks feature. */
export interface BookmarksShape {
  items: BookmarkItem[]
}