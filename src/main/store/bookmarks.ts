import type { BookmarkItem, BookmarkFolder } from '../../shared/types'

/** Shape persisted on disk for the bookmarks feature. */
export interface BookmarksShape {
  items: BookmarkItem[]
  folders?: BookmarkFolder[]
}
