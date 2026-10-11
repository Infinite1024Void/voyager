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

export function DownloadsPanel({ open, onClose, items, onClear }: DownloadsPanelProps): React.JSX.Element | null {
  useOverlaySignal(open)
  const [query, setQuery] = useState('')

  if (!open) return null

  const filtered = items.filter((item) => {
    const q = query.toLowerCase()
    return item.filename.toLowerCase().includes(q) || item.url.toLowerCase().includes(q)
  })

  return (
    <div className="fixed inset-0 z-40" onMouseDown={onClose}>
      <div
        className="no-drag mx-auto mt-[14vh] w-[760px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl shadow-black/20"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-3.5 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
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
          </div>
          <button
            type="button"
            className="no-drag flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-muted transition-colors hover:bg-hover hover:text-fg"
            onClick={onClear}
          >
            Clear
          </button>
        </div>
        <div className="max-h-[360px] overflow-y-auto py-1.5">
          {filtered.length === 0 ? (
            <p className="px-3.5 py-3 text-[13px] text-muted">No downloads</p>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-3.5 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-fg">{item.filename}</p>
                  <p className="truncate text-[11.5px] text-muted">{item.url}</p>
                </div>
                {item.state === 'progressing' && item.totalBytes > 0 && (
                  <p className="shrink-0 text-[11px] text-muted">
                    {Math.round((item.receivedBytes / item.totalBytes) * 100)}%
                  </p>
                )}
                {item.state === 'completed' && <p className="shrink-0 text-[11px] text-accent">Completed</p>}
                {item.state === 'interrupted' && <p className="shrink-0 text-[11px] text-danger">Interrupted</p>}
                {item.state === 'cancelled' && <p className="shrink-0 text-[11px] text-muted">Cancelled</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
