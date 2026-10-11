import { useState } from 'react'
import { useBookmarksStore } from '../state/bookmarksStore'
import { useBrowserStore } from '../state/browserStore'
import { ContextMenu } from './ui/ContextMenu'

interface MenuState {
  id: string
  x: number
  y: number
}

/** Horizontal strip of bookmark shortcuts shown below the toolbar. */
export function BookmarksBar(): React.JSX.Element | null {
  const items = useBookmarksStore((state) => state.items)
  const barVisible = useBookmarksStore((state) => state.barVisible)
  const navigate = useBrowserStore((state) => state.navigate)
  const removeBookmark = useBookmarksStore((state) => state.removeBookmark)

  const [menu, setMenu] = useState<MenuState | null>(null)
  const menuItem = menu ? items.find((item) => item.id === menu.id) : undefined

  if (!barVisible) return null

  return (
    <nav
      className="no-drag flex h-[30px] shrink-0 items-center gap-0.5 overflow-hidden border-b border-border bg-bg px-1.5"
      onContextMenu={(event) => event.preventDefault()}
    >
      {items.length === 0 ? (
        <span className="px-2 text-[12px] text-muted">Bookmarks you add will live here</span>
      ) : (
        items.map((bookmark) => (
          <div
            key={bookmark.id}
            className="relative flex max-w-[180px] shrink-0"
            onContextMenu={(event) => {
              event.preventDefault()
              setMenu({ id: bookmark.id, x: event.clientX, y: event.clientY })
            }}
          >
            <button
              type="button"
              onClick={() => navigate(bookmark.url)}
              title={bookmark.url}
              className="flex h-[22px] max-w-full items-center rounded-md px-2 text-[12px] text-fg transition-colors hover:bg-hover"
            >
              <span className="truncate">{bookmark.title}</span>
            </button>
          </div>
        ))
      )}
      {menu !== null && menuItem && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={[
            { label: 'Open', onSelect: () => navigate(menuItem.url) },
            { label: 'Remove', danger: true, onSelect: () => removeBookmark(menuItem.id) }
          ]}
          onClose={() => setMenu(null)}
        />
      )}
    </nav>
  )
}