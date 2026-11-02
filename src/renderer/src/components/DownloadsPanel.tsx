import { useState } from 'react'
import { FolderDown } from 'lucide-react'
import { useOverlaySignal } from '../lib/overlay'

interface DownloadItem {
  id: string
  url: string
  filename: string
  receivedBytes: number
  totalBytes: number
  state: 'progressing' | 'completed' | 'interrupted' | 'cancelled'
  path?: string
  startTime: number
  endTime?: number
}

interface DownloadsPanelProps {
  open: boolean
  onClose: () => void
  items: DownloadItem[]
  onClear: () => void
}

function percent(item: DownloadItem): number {
  if (item.totalBytes <= 0) return 0
  return Math.min(100, Math.round((item.receivedBytes / item.totalBytes) * 100))
}

export function DownloadsPanel({ open, onClose, items, onClear }: DownloadsPanelProps): React.JSX.Element | null {
  useOverlaySignal(open)
  const [query, setQuery] = useState('')

  if (!open) return null

  const filtered = items.filter((item) => {
    const q = query.toLowerCase()
    return item.filename.toLowerCase().includes(q) || item.url.toLowerCase().includes(q)
  })

  const active = filtered.filter((item) => item.state === 'progressing')
  const finished = filtered.filter((item) => item.state !== 'progressing')

  return (
    <div className="fixed inset-0 z-40" onMouseDown={onClose}>
      <div
        className="no-drag absolute right-3 top-[84px] flex w-[380px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl shadow-black/20"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-3.5 py-3">
          <FolderDown className="h-4 w-4 shrink-0 text-muted" />
          <input
            autoFocus
            type="text"
            value={query}
            placeholder="Search downloads"
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-muted"
            onKeyDown={(event) => {
              if (event.key === 'Escape') onClose()
            }}
          />
          <button
            type="button"
            className="no-drag flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-muted transition-colors hover:bg-hover hover:text-fg"
            onClick={onClear}
          >
            Clear
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto py-1.5">
          {filtered.length === 0 ? (
            <p className="px-3.5 py-3 text-[13px] text-muted">No downloads yet</p>
          ) : (
            <>
              {active.length > 0 && (
                <div className="px-3.5 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted">
                  In progress
                </div>
              )}
              {active.map((item) => {
                const pct = percent(item)
                return (
                  <div key={item.id} className="space-y-1.5 px-3.5 py-2">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-fg">{item.filename}</p>
                        <p className="truncate text-[11px] text-muted">{item.url}</p>
                      </div>
                      <p className="shrink-0 text-[11px] text-muted">{pct}%</p>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-hover">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: item.totalBytes > 0 ? `${pct}%` : '50%' }}
                      />
                    </div>
                  </div>
                )
              })}

              {finished.length > 0 && (
                <div className="px-3.5 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                  Recent
                </div>
              )}
              {finished.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-3.5 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-fg">{item.filename}</p>
                    <p className="truncate text-[11px] text-muted">
                      {item.state === 'completed' && item.totalBytes > 0
                        ? `${Math.round(item.receivedBytes / 1024)} KB`
                        : item.url}
                    </p>
                  </div>
                  {item.state === 'completed' && (
                    <p className="shrink-0 text-[11px] text-accent">Completed</p>
                  )}
                  {item.state === 'interrupted' && (
                    <p className="shrink-0 text-[11px] text-danger">Interrupted</p>
                  )}
                  {item.state === 'cancelled' && (
                    <p className="shrink-0 text-[11px] text-muted">Cancelled</p>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}