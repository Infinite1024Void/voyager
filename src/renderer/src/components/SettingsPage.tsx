import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useBookmarksStore } from '../state/bookmarksStore'
import { useHistoryStore } from '../state/historyStore'
import { useDownloadsStore } from '../state/downloadsStore'
import { useBrowserStore } from '../state/browserStore'
import { useTheme } from './providers/theme-context'
import type { ThemeMode, UserPreferences } from '../../../shared/types'
import { SitePermissionsSettings } from './SitePermissionsSettings'

function sitePermissionsRoute(): { open: boolean; origin?: string } {
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash.startsWith('site-permissions')) return { open: false }
  const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  const origin = new URLSearchParams(query).get('origin') ?? undefined
  return { open: true, origin }
}

export function SettingsPage(): React.JSX.Element {
  const { mode, setMode } = useTheme()
  const bookmarks = useBookmarksStore((state) => state.items)
  const history = useHistoryStore((state) => state.entries)
  const downloads = useDownloadsStore((state) => state.items)
  const { tabs, activeTabId } = useBrowserStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const [searchEngine, setSearchEngine] = useState('duckduckgo')
  const [preferences, setPreferences] = useState<UserPreferences>({
    clearHistory: true,
    clearDownloads: true,
    clearBookmarks: false,
    openDownloadsWhenDone: false
  })
  const [clearing, setClearing] = useState(false)
  const [initialRoute] = useState(sitePermissionsRoute)
  const [sitePermissionsOpen, setSitePermissionsOpen] = useState(initialRoute.open)

  useEffect(() => {
    const bookmarks = useBookmarksStore.getState()
    const history = useHistoryStore.getState()
    const downloads = useDownloadsStore.getState()
    const browser = useBrowserStore.getState()

    void window.voyager.bookmarks.getState().then(useBookmarksStore.getState().applyState)
    void window.voyager.history.getState().then(useHistoryStore.getState().applyState)
    void window.voyager.downloads.getState().then(useDownloadsStore.getState().applyState)
    void window.voyager.tabs.getState().then(browser.applyState)
    void window.voyager.settings.get().then(setPreferences)

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

  const setPreference = async (key: keyof UserPreferences, value: boolean) => {
    const next = { ...preferences, [key]: value }
    setPreferences(next)
    await window.voyager.settings.set(key, value)
  }

  const clearSelected = async () => {
    setClearing(true)
    try {
      if (preferences.clearHistory) await window.voyager.history.clear()
      if (preferences.clearDownloads) await window.voyager.downloads.clear()
      if (preferences.clearBookmarks) await window.voyager.bookmarks.clear()
      void window.voyager.history.getState().then(useHistoryStore.getState().applyState)
      void window.voyager.downloads.getState().then(useDownloadsStore.getState().applyState)
      void window.voyager.bookmarks.getState().then(useBookmarksStore.getState().applyState)
    } finally {
      setClearing(false)
    }
  }

  if (sitePermissionsOpen) {
    return (
      <SitePermissionsSettings
        initialOrigin={initialRoute.origin}
        onBack={() => {
          setSitePermissionsOpen(false)
          window.history.replaceState(null, '', window.location.href.split('#')[0])
        }}
      />
    )
  }

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
            <h2 className="mb-4 text-[15px] font-semibold text-fg">Privacy and security</h2>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 rounded-md border border-border bg-bg px-3 py-2.5 text-left transition-colors hover:bg-hover"
              onClick={() => setSitePermissionsOpen(true)}
            >
              <span>
                <span className="block text-[13px] text-fg">Site permissions</span>
                <span className="mt-0.5 block text-[11.5px] text-muted">
                  Manage location, notifications, camera, microphone and more.
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            </button>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-4 text-[15px] font-semibold text-fg">Downloads</h2>
            <label className="flex items-center gap-2 text-[13px] text-fg">
              <input
                type="checkbox"
                checked={preferences.openDownloadsWhenDone}
                onChange={(event) => setPreference('openDownloadsWhenDone', event.target.checked)}
              />
              <span>Open files automatically when downloads finish</span>
            </label>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-4 text-[15px] font-semibold text-fg">Clear browsing data</h2>
            <p className="mb-4 text-[13px] text-fg">
              Choose what Voyager includes when clearing data.
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[13px] text-fg">
                <input
                  type="checkbox"
                  checked={preferences.clearHistory}
                  onChange={(event) => setPreference('clearHistory', event.target.checked)}
                />
                <span>Browsing history</span>
              </label>
              <label className="flex items-center gap-2 text-[13px] text-fg">
                <input
                  type="checkbox"
                  checked={preferences.clearDownloads}
                  onChange={(event) => setPreference('clearDownloads', event.target.checked)}
                />
                <span>Download history</span>
              </label>
              <label className="flex items-center gap-2 text-[13px] text-fg">
                <input
                  type="checkbox"
                  checked={preferences.clearBookmarks}
                  onChange={(event) => setPreference('clearBookmarks', event.target.checked)}
                />
                <span>Bookmarks</span>
              </label>
            </div>
            <button
              type="button"
              className="mt-4 rounded-md bg-accent px-3 py-1.5 text-[13px] text-accent-foreground disabled:opacity-50"
              disabled={
                clearing ||
                !(
                  preferences.clearHistory ||
                  preferences.clearDownloads ||
                  preferences.clearBookmarks
                )
              }
              onClick={clearSelected}
            >
              {clearing ? 'Clearing...' : 'Clear selected data'}
            </button>
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
