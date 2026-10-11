import { useEffect, useState } from 'react'
import { ThemeProvider } from './components/providers/ThemeProvider'
import { BookmarksBar } from './components/BookmarksBar'
import { HistoryPanel } from './components/HistoryPanel'
import { TabSearchPalette } from './components/TabSearchPalette'
import { TitleBar } from './components/TitleBar'
import { Toolbar } from './components/Toolbar'
import { focusOmnibox, installChromeShortcuts } from './lib/shortcuts'
import { useBookmarksStore } from './state/bookmarksStore'
import { useBrowserStore } from './state/browserStore'
import { useHistoryStore } from './state/historyStore'
import { useUiStore } from './state/uiStore'

export default function App(): React.JSX.Element {
  const [historyOpen, setHistoryOpen] = useState(false)

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

  // Chrome-focused keyboard shortcuts.
  useEffect(() => installChromeShortcuts(), [])

  // Shortcuts routed from the main process while page content is focused.
  useEffect(() => {
    const unsubFocus = window.voyager.ui.onFocusOmnibox(focusOmnibox)
    const unsubSearch = window.voyager.ui.onOpenTabSearch(() =>
      useUiStore.getState().openTabSearch()
    )
    // Cmd+Y also triggers open-tab-search; map to history panel.
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() === 'y' && (event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        setHistoryOpen(true)
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
    </ThemeProvider>
  )
}