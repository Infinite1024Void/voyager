import { useEffect, useState } from 'react'
import { ThemeProvider } from './components/providers/ThemeProvider'
import { BookmarksBar } from './components/BookmarksBar'
import { DownloadsPanel } from './components/DownloadsPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { TabSearchPalette } from './components/TabSearchPalette'
import { TitleBar } from './components/TitleBar'
import { Toolbar } from './components/Toolbar'
import { focusOmnibox, installChromeShortcuts } from './lib/shortcuts'
import { useBookmarksStore } from './state/bookmarksStore'
import { useBrowserStore } from './state/browserStore'
import { useDownloadsStore } from './state/downloadsStore'
import { useHistoryStore } from './state/historyStore'
import { useUiStore } from './state/uiStore'

export default function App(): React.JSX.Element {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [downloadsOpen, setDownloadsOpen] = useState(false)

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

  // Chrome-focused keyboard shortcuts.
  useEffect(() => installChromeShortcuts(), [])

  // Shortcuts routed from the main process while page content is focused.
  useEffect(() => {
    const unsubFocus = window.voyager.ui.onFocusOmnibox(focusOmnibox)
    const unsubSearch = window.voyager.ui.onOpenTabSearch(() =>
      useUiStore.getState().openTabSearch()
    )
    // Cmd+Y also triggers open-tab-search; map to history panel. Cmd+Shift+J for downloads.
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() === 'y' && (event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        setHistoryOpen(true)
        return
      }
      if (event.key.toLowerCase() === 'j' && (event.metaKey || event.ctrlKey) && event.shiftKey && !event.altKey) {
        event.preventDefault()
        setDownloadsOpen((v) => !v)
        return
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      unsubFocus()
      unsubSearch()
      window.removeEventListener('keydown', handleKey)
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
      <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <DownloadsPanel
        open={downloadsOpen}
        onClose={() => setDownloadsOpen(false)}
        items={useDownloadsStore((state) => state.items)}
        onClear={() => {
          void window.voyager.downloads.clear()
        }}
      />
    </ThemeProvider>
  )
}