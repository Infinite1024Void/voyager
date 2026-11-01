import { useEffect, useState } from 'react'
import { useBookmarksStore } from '../state/bookmarksStore'
import { useHistoryStore } from '../state/historyStore'
import { useDownloadsStore } from '../state/downloadsStore'
import { useBrowserStore } from '../state/browserStore'
import { useTheme } from './providers/theme-context'
import type { ThemeMode } from '../../../shared/types'

export function SettingsPage(): React.JSX.Element {
  const { mode, setMode } = useTheme()
  const bookmarks = useBookmarksStore((state) => state.items)
  const history = useHistoryStore((state) => state.entries)
  const downloads = useDownloadsStore((state) => state.items)
  const { tabs, activeTabId } = useBrowserStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const [searchEngine, setSearchEngine] = useState('duckduckgo')

  useEffect(() => {
    const bookmarks = useBookmarksStore.getState()
    const history = useHistoryStore.getState()
    const downloads = useDownloadsStore.getState()
    const browser = useBrowserStore.getState()

    void window.voyager.bookmarks.getState().then(bookmarks.applyState)
    void window.voyager.history.getState().then(history.applyState)
    void window.voyager.downloads.getState().then(downloads.applyState)
    void window.voyager.tabs.getState().then(browser.applyState)

    const unsubscribes = [
      window.voyager.bookmarks.onStateChanged(bookmarks.applyState),
      window.voyager.history.onStateChanged(history.applyState),
      window.voyager.downloads.onStateChanged(downloads.applyState),
      window.voyager.tabs.onStateChanged(browser.applyState)
    ]
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [])

  useEffect(() => {
    document.title = 'Settings - Voyager'
  }, [])

  return (
    <div className="h-full w-full overflow-y-auto bg-bg text-fg">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold text-fg">Settings</h1>
        </div>

        <div className="space-y-8">
          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-4 text-[15px] font-semibold text-fg">Appearance</h2>
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

          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-4 text-[15px] font-semibold text-fg">Search</h2>
            <select
              className="rounded-md border border-border bg-bg px-2 py-1 text-[13px] text-fg"
              value={searchEngine}
              onChange={(e) => setSearchEngine(e.target.value)}
            >
              <option value="duckduckgo">DuckDuckGo</option>
            </select>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-4 text-[15px] font-semibold text-fg">Data</h2>
            <div className="space-y-2 text-[13px] text-fg">
              <div>Bookmarks: {bookmarks.length}</div>
              <div>History entries: {history.length}</div>
              <div>Downloads: {downloads.length}</div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-4 text-[15px] font-semibold text-fg">About</h2>
            <div className="space-y-1 text-[13px] text-fg">
              <div>Voyager Web Browser</div>
              <div>Active tab: {activeTab?.title ?? 'None'}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
