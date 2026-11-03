import { useEffect, useState } from 'react'
import { ThemeProvider } from './components/providers/ThemeProvider'
import { BookmarksBar } from './components/BookmarksBar'
import { DownloadsPanel } from './components/DownloadsPanel'
import { FindBar } from './components/FindBar'
import { HistoryPanel } from './components/HistoryPanel'
import { PermissionPrompt } from './components/PermissionPrompt'
import { TabSearchPalette } from './components/TabSearchPalette'
import { TitleBar } from './components/TitleBar'
import { Toolbar } from './components/Toolbar'
import { focusOmnibox, installChromeShortcuts } from './lib/shortcuts'
import { useBookmarksStore } from './state/bookmarksStore'
import { useBrowserStore } from './state/browserStore'
import { useDownloadsStore } from './state/downloadsStore'
import { useHistoryStore } from './state/historyStore'
import { usePermissionsStore } from './state/permissionsStore'
import { useUiStore } from './state/uiStore'

export default function App(): React.JSX.Element {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyClearPrompt, setHistoryClearPrompt] = useState(0)
  const [downloadsOpen, setDownloadsOpen] = useState(false)
  const [findOpen, setFindOpen] = useState(false)
  useUiStore()

  useEffect(() => {
    const { applyState } = useBrowserStore.getState()
    void window.voyager.tabs.getState().then(applyState)
    return window.voyager.tabs.onStateChanged(applyState)
  }, [])

  useEffect(() => {
    const { applyState } = useBookmarksStore.getState()
    void window.voyager.bookmarks.getState().then(applyState)
    return window.voyager.bookmarks.onStateChanged(applyState)
  }, [])

  useEffect(() => {
    const { applyState } = useHistoryStore.getState()
    void window.voyager.history.getState().then(applyState)
    return window.voyager.history.onStateChanged(applyState)
  }, [])

  useEffect(() => {
    const { applyState } = useDownloadsStore.getState()
    void window.voyager.downloads.getState().then(applyState)
    return window.voyager.downloads.onStateChanged(applyState)
  }, [])

  useEffect(() => {
    const { applyState } = usePermissionsStore.getState()
    void window.voyager.permissions.getState().then(applyState)
    return window.voyager.permissions.onStateChanged(applyState)
  }, [])

  // Chrome-focused keyboard shortcuts.
  useEffect(() => installChromeShortcuts(), [])

  // Shortcuts routed from the main process (page focused) and from the chrome
  // keydown handler share one set of window events.
  useEffect(() => {
    const openHistory = (): void => setHistoryOpen(true)
    const openDownloads = (): void => setDownloadsOpen(true)
    const openFind = (): void => setFindOpen(true)
    const openHistoryClear = (): void => {
      setHistoryOpen(true)
      setHistoryClearPrompt((value) => value + 1)
    }

    window.addEventListener('voyager:open-history', openHistory)
    window.addEventListener('voyager:open-downloads', openDownloads)
    window.addEventListener('voyager:open-find', openFind)
    window.addEventListener('voyager:open-history-clear', openHistoryClear)

    const unsubFocus = window.voyager.ui.onFocusOmnibox(focusOmnibox)
    const unsubSearch = window.voyager.ui.onOpenTabSearch(() =>
      useUiStore.getState().openTabSearch()
    )
    const unsubHistory = window.voyager.ui.onOpenHistory(openHistory)
    const unsubDownloads = window.voyager.ui.onOpenDownloads(openDownloads)
    const unsubFind = window.voyager.ui.onFindInPage(openFind)

    return () => {
      window.removeEventListener('voyager:open-history', openHistory)
      window.removeEventListener('voyager:open-downloads', openDownloads)
      window.removeEventListener('voyager:open-find', openFind)
      window.removeEventListener('voyager:open-history-clear', openHistoryClear)
      unsubFocus()
      unsubSearch()
      unsubHistory()
      unsubDownloads()
      unsubFind()
    }
  }, [])

  return (
    <ThemeProvider>
      <div className="flex h-full flex-col overflow-hidden">
        <TitleBar />
        <Toolbar />
        <BookmarksBar />
      </div>
      <TabSearchPalette />
      <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        clearPrompt={historyClearPrompt}
      />
      <DownloadsPanel
        open={downloadsOpen}
        onClose={() => setDownloadsOpen(false)}
        items={useDownloadsStore((state) => state.items)}
        onClear={() => {
          void window.voyager.downloads.clear()
        }}
      />
      <FindBar open={findOpen} onClose={() => setFindOpen(false)} />
      <PermissionPrompt />
    </ThemeProvider>
  )
}
