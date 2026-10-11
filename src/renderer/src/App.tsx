import { useEffect } from 'react'
import { ThemeProvider } from './components/providers/ThemeProvider'
import { TabSearchPalette } from './components/TabSearchPalette'
import { TitleBar } from './components/TitleBar'
import { Toolbar } from './components/Toolbar'
import { focusOmnibox, installChromeShortcuts } from './lib/shortcuts'
import { useBrowserStore } from './state/browserStore'
import { useUiStore } from './state/uiStore'

export default function App(): React.JSX.Element {
  useEffect(() => {
    const { applyState } = useBrowserStore.getState()
    void window.voyager.tabs.getState().then(applyState)
    return window.voyager.tabs.onStateChanged(applyState)
  }, [])

  // Chrome-focused keyboard shortcuts.
  useEffect(() => installChromeShortcuts(), [])

  // Shortcuts routed from the main process while page content is focused.
  useEffect(() => {
    const unsubFocus = window.voyager.ui.onFocusOmnibox(focusOmnibox)
    const unsubSearch = window.voyager.ui.onOpenTabSearch(() =>
      useUiStore.getState().openTabSearch()
    )
    return () => {
      unsubFocus()
      unsubSearch()
    }
  }, [])

  return (
    <ThemeProvider>
      <div className="flex h-full flex-col overflow-hidden">
        <TitleBar />
        <Toolbar />
      </div>
      <TabSearchPalette />
    </ThemeProvider>
  )
}