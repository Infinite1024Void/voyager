import { useState } from 'react'
import { useOverlaySignal } from '../lib/overlay'
import { useBookmarksStore } from '../state/bookmarksStore'
import { useHistoryStore } from '../state/historyStore'
import { useDownloadsStore } from '../state/downloadsStore'
import { useBrowserStore } from '../state/browserStore'
import { useTheme } from './providers/theme-context'
import type { ThemeMode } from '../../../shared/types'

interface SettingsPageProps {
  open: boolean
  onClose: () => void
}

export function SettingsPage({ open, onClose }: SettingsPageProps): React.JSX.Element | null {
  useOverlaySignal(open)
  const { mode, setMode } = useTheme()
  const bookmarks = useBookmarksStore((state) => state.items)
  const history = useHistoryStore((state) => state.entries)
  const downloads = useDownloadsStore((state) => state.items)
  const { tabs, activeTabId } = useBrowserStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const [searchEngine, setSearchEngine] = useState('duckduckgo')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40" onMouseDown={onClose}>
      <div
        className="no-drag mx-auto mt-[10vh] h-[80vh] w-[840px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl shadow-black/20"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h1 className="text-[16px] font-semibold text-fg">Settings</h1>
            <button
              type="button"
              className="no-drag flex h-8 items-center rounded-md px-2 text-[13px] text-muted transition-colors hover:bg-hover hover:text-fg"
              onClick={onClose}
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-8">
              <section>
                <h2 className="mb-3 text-[14px] font-semibold text-fg">Appearance</h2>
                <div className="space-y-2">
                  {(['system', 'light', 'dark'] as ThemeMode[]).map((m) => (
                    <label key={m} className="flex items-center gap-2 text-[13px] text-fg">
                      <input
                        type="radio"
                        name="theme"
                        checked={mode === m}
                        onChange={() => setMode(m)}
                      />
                      <span className="capitalize">{m}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-[14px] font-semibold text-fg">Search</h2>
                <select
                  className="rounded-md border border-border bg-bg px-2 py-1 text-[13px] text-fg"
                  value={searchEngine}
                  onChange={(e) => setSearchEngine(e.target.value)}
                >
                  <option value="duckduckgo">DuckDuckGo</option>
                </select>
              </section>

              <section>
                <h2 className="mb-3 text-[14px] font-semibold text-fg">Data</h2>
                <div className="space-y-2 text-[13px] text-fg">
                  <div>Bookmarks: {bookmarks.length}</div>
                  <div>History entries: {history.length}</div>
                  <div>Downloads: {downloads.length}</div>
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-[14px] font-semibold text-fg">About</h2>
                <div className="space-y-1 text-[13px] text-fg">
                  <div>Voyager Web Browser</div>
                  <div>Active tab: {activeTab?.title ?? 'None'}</div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
