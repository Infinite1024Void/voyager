import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { useOverlaySignal } from '../lib/overlay'
import { useBrowserStore } from '../state/browserStore'
import { searchHistory, useHistoryStore } from '../state/historyStore'

export function HistoryPanel({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}): React.JSX.Element | null {
  const entries = useHistoryStore((state) => state.entries)
  const remove = useHistoryStore((state) => state.remove)
  const navigate = useBrowserStore((state) => state.navigate)
  const [query, setQuery] = useState('')

  useOverlaySignal(open)

  if (!open) return null

  const results = searchHistory(entries, query)
  const items = results

  return (
    <div className="fixed inset-0 z-40" onMouseDown={onClose}>
      <div
        className="no-drag mx-auto mt-[14vh] w-[720px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl shadow-black/20"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-3.5 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            autoFocus
            type="text"
            value={query}
            placeholder="Search history"
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-muted"
            onKeyDown={(event) => {
              if (event.key === 'Escape') onClose()
            }}
          />
        </div>

        <div className="max-h-[360px] overflow-y-auto py-1.5">
          {items.length === 0 ? (
            <p className="px-3.5 py-3 text-[13px] text-muted">No matching history</p>
          ) : (
            items.map((entry) => (
              <div
                key={entry.id}
                className="group flex w-full items-center gap-3 px-3.5 py-2 text-left hover:bg-hover"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    navigate(entry.url)
                    onClose()
                  }}
                  title={entry.url}
                >
                  <span className="block truncate text-[13px] text-fg">{entry.title || entry.url}</span>
                  <span className="block truncate text-[11.5px] text-muted">{entry.url}</span>
                </button>
                <button
                  type="button"
                  className="no-drag flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted opacity-0 transition-opacity hover:bg-hover hover:text-fg group-hover:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation()
                    remove(entry.id)
                  }}
                  aria-label="Remove from history"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
