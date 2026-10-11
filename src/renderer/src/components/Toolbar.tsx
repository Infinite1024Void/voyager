import { ArrowLeft, ArrowRight, Download, RotateCw, Star, X } from 'lucide-react'
import { cn } from '../lib/cn'
import { useActiveTab, useBrowserStore } from '../state/browserStore'
import { useBookmarksStore, useIsBookmarked } from '../state/bookmarksStore'
import { IconButton } from './ui/IconButton'
import { Omnibox } from './Omnibox'

export function Toolbar(): React.JSX.Element {
  const activeTab = useActiveTab()
  const goBack = useBrowserStore((state) => state.goBack)
  const goForward = useBrowserStore((state) => state.goForward)
  const reload = useBrowserStore((state) => state.reload)
  const stop = useBrowserStore((state) => state.stop)

  const addBookmark = useBookmarksStore((state) => state.addBookmark)
  const removeBookmark = useBookmarksStore((state) => state.removeBookmark)
  const isBookmarked = useIsBookmarked(activeTab?.url ?? '')

  const loading = activeTab?.loading ?? false
  const canGoBack = activeTab?.canGoBack ?? false
  const canGoForward = activeTab?.canGoForward ?? false
  const bookmarkDisabled =
    activeTab === undefined || activeTab.url === '' || activeTab.url === 'about:blank'

  const toggleBookmark = (): void => {
    if (activeTab === undefined) return
    if (isBookmarked) {
      const existing = useBookmarksStore
        .getState()
        .items.find((item) => item.url === activeTab.url)
      if (existing) removeBookmark(existing.id)
    } else {
      addBookmark(activeTab.title || activeTab.url, activeTab.url)
    }
  }

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
      <IconButton
        label={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
        disabled={bookmarkDisabled}
        onClick={toggleBookmark}
      >
        <Star className={cn('h-4 w-4', isBookmarked && 'fill-accent text-accent')} />
      </IconButton>
      <IconButton label="Downloads" onClick={() => window.dispatchEvent(new Event('voyager:open-downloads'))}>
        <Download className="h-4 w-4" />
      </IconButton>
    </div>
  )
}