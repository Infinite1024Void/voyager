import { useEffect, useMemo, useState } from 'react'
import { Search, Trash2, X } from 'lucide-react'
import { useOverlaySignal } from '../lib/overlay'
import { useBrowserStore } from '../state/browserStore'
import type { HistoryEntry } from '../../../shared/types'
import { searchHistory, useHistoryStore } from '../state/historyStore'

interface HistoryGroup {
  label: string
  entries: HistoryEntry[]
}

function historyDateLabel(timestamp: number): string {
  const now = new Date()
  const date = new Date(timestamp)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const visitDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const daysAgo = Math.round((today - visitDay) / 86_400_000)

  if (daysAgo <= 0) return 'Today'
  if (daysAgo === 1) return 'Yesterday'
  if (daysAgo < 7) return date.toLocaleDateString(undefined, { weekday: 'long' })
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
  }
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatHistoryTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  })
}

function groupHistory(entries: HistoryEntry[]): HistoryGroup[] {
  const groups = new Map<string, HistoryEntry[]>()
  for (const entry of entries) {
    const label = historyDateLabel(entry.visitedAt)
    const bucket = groups.get(label)
    if (bucket) bucket.push(entry)
    else groups.set(label, [entry])
  }
  return Array.from(groups, ([label, grouped]) => ({ label, entries: grouped }))
}

export function HistoryPanel({
  open,
  onClose,
  clearPrompt = 0
}: {
  open: boolean
  onClose: () => void
  clearPrompt?: number
}): React.JSX.Element | null {
  const entries = useHistoryStore((state) => state.entries)
  const remove = useHistoryStore((state) => state.remove)
  const clear = useHistoryStore((state) => state.clear)
  const navigate = useBrowserStore((state) => state.navigate)
  const [query, setQuery] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    if (clearPrompt > 0) {
      setConfirmClear(true)
    }
  }, [clearPrompt])

  useOverlaySignal(open)

  const results = useMemo(() => searchHistory(entries, query), [entries, query])
  const groups = useMemo(() => groupHistory(results), [results])

  if (!open) return null

  const handleClear = () => {
    clear()
    setConfirmClear(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40" onMouseDown={onClose}>
      <div
        className="no-drag mx-auto mt-[10vh] flex h-[min(640px,80vh)] w-[760px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl shadow-black/20"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
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
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-fg"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between border-b border-border px-4 py-2 text-[12px] text-muted">
          <span>
            {results.length} result{results.length === 1 ? '' : 's'}
          </span>
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-fg">Clear all history?</span>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="rounded-md border border-border px-2 py-1 text-fg hover:bg-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-md bg-accent px-2 py-1 text-accent-foreground hover:opacity-90"
              >
                Clear all
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-fg transition-colors hover:bg-hover"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear history
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-muted">No matching history</p>
          ) : (
            groups.map((group) => (
              <section key={group.label} className="mb-4 last:mb-2">
                <h3 className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {group.label}
                </h3>
                <div>
                  {group.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="group relative flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-hover"
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
                        <span className="block truncate text-[13px] text-fg">
                          {entry.title || entry.url}
                        </span>
                        <span className="block truncate text-[11.5px] text-muted">
                          {entry.url} · {formatHistoryTime(entry.visitedAt)}
                          {entry.visitCount > 1 ? ` · ${entry.visitCount} visits` : ''}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          remove(entry.id)
                        }}
                        aria-label="Remove from history"
                        className="no-drag flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted opacity-0 transition-opacity hover:bg-hover hover:text-fg group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
