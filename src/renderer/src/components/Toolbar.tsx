import { ArrowLeft, ArrowRight, Download, RotateCw, Star, X } from 'lucide-react'
import { useActiveTab, useBrowserStore } from '../state/browserStore'
import { IconButton } from './ui/IconButton'
import { Omnibox } from './Omnibox'

export function Toolbar(): React.JSX.Element {
  const activeTab = useActiveTab()
  const goBack = useBrowserStore((state) => state.goBack)
  const goForward = useBrowserStore((state) => state.goForward)
  const reload = useBrowserStore((state) => state.reload)
  const stop = useBrowserStore((state) => state.stop)

  const loading = activeTab?.loading ?? false
  const canGoBack = activeTab?.canGoBack ?? false
  const canGoForward = activeTab?.canGoForward ?? false

  return (
    <div className="flex h-[44px] shrink-0 items-center gap-1 border-b border-border bg-bg px-2">
      <IconButton label="Back" disabled={!canGoBack} onClick={goBack}>
        <ArrowLeft className="h-4 w-4" />
      </IconButton>
      <IconButton label="Forward" disabled={!canGoForward} onClick={goForward}>
        <ArrowRight className="h-4 w-4" />
      </IconButton>
      {loading ? (
        <IconButton label="Stop" onClick={stop}>
          <X className="h-4 w-4" />
        </IconButton>
      ) : (
        <IconButton label="Reload" onClick={reload}>
          <RotateCw className="h-4 w-4" />
        </IconButton>
      )}

      <button
        type="button"
        className="no-drag mx-1 h-4 w-px shrink-0 bg-border"
        aria-hidden="true"
        tabIndex={-1}
      />

      <Omnibox />

      <div className="w-1" />
      <IconButton label="Bookmark this page" disabled>
        <Star className="h-4 w-4" />
      </IconButton>
      <IconButton label="Downloads" disabled>
        <Download className="h-4 w-4" />
      </IconButton>
    </div>
  )
}