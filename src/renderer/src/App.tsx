import { useEffect } from 'react'
import { ThemeProvider } from './components/providers/ThemeProvider'
import { TitleBar } from './components/TitleBar'
import { Toolbar } from './components/Toolbar'
import { useBrowserStore } from './state/browserStore'

export default function App(): React.JSX.Element {
  useEffect(() => {
    const { applyState } = useBrowserStore.getState()
    void window.voyager.tabs.getState().then(applyState)
    return window.voyager.tabs.onStateChanged(applyState)
  }, [])

  return (
    <ThemeProvider>
      <div className="flex h-full flex-col overflow-hidden">
        <TitleBar />
        <Toolbar />
      </div>
    </ThemeProvider>
  )
}