import { useState } from 'react'
import { FolderDown, Pause, Play, X } from 'lucide-react'
import type { DownloadItem } from '../../../shared/types'
import type { ContextMenuItem } from './ui/ContextMenu'
import { ContextMenu } from './ui/ContextMenu'
import { useDownloadsStore } from '../state/downloadsStore'
import { useOverlaySignal } from '../lib/overlay'

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

export function DownloadsPanel({
  open,
  onClose,
  items,
  onClear
}: DownloadsPanelProps): React.JSX.Element | null {
  useOverlaySignal(open)
  const [query, setQuery] = useState('')
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    id: string
  } | null>(null)

  const contextItem = items.find((entry) => entry.id === contextMenu?.id) ?? null
  const contextItems: ContextMenuItem[] =
    contextItem !== null
      ? [
          {
            label: 'Remove from History',
            danger: true,
            onSelect: () => {
              void window.voyager.downloads
                .remove(contextItem.id)
                .then((state) => useDownloadsStore.getState().applyState(state))
            }
          },
          { separator: true },
          {
            label: 'Copy Download URL',
            onSelect: () => {
              void window.voyager.downloads.copyUrl(contextItem.id)
            }
          },
          {
            label: 'Open in Folder',
            disabled: !contextItem.path,
            onSelect: () => {
              void window.voyager.downloads.openFolder(contextItem.id)
            }
          }
        ]
      : []

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
                  <div
                    key={item.id}
                    className="group space-y-1.5 px-3.5 py-2"
                    onContextMenu={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      setContextMenu({ x: event.clientX, y: event.clientY, id: item.id })
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-fg">{item.filename}</p>
                        <p className="truncate text-[11px] text-muted">{item.url}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          aria-label={item.paused ? 'Resume download' : 'Pause download'}
                          title={item.paused ? 'Resume' : 'Pause'}
                          className="no-drag flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-fg"
                          onClick={() =>
                            void (item.paused
                              ? window.voyager.downloads.resume(item.id)
                              : window.voyager.downloads.pause(item.id))
                          }
                        >
                          {item.paused ? (
                            <Play className="h-3.5 w-3.5" />
                          ) : (
                            <Pause className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          aria-label="Cancel download"
                          title="Cancel"
                          className="no-drag flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-danger"
                          onClick={() => void window.voyager.downloads.cancel(item.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="w-10 shrink-0 text-right text-[11px] text-muted">
                        {item.paused ? 'Paused' : `${pct}%`}
                      </p>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-hover">
                      <div
                        className={`h-full transition-all ${item.paused ? 'bg-muted' : 'bg-accent'}`}
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
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-3.5 py-2"
                  onContextMenu={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    setContextMenu({ x: event.clientX, y: event.clientY, id: item.id })
                  }}
                >
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
      {contextMenu && contextItem && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
