import { useEffect } from 'react'

/**
 * The chrome view is normally clipped to the height of the tab strip + toolbar.
 * While any overlay (omnibox dropdown, tab palette, context menu, popover) is
 * mounted, we ask the main process to expand the chrome view over the page so
 * the overlay is not cut off. A module-level counter keeps the expansion alive
 * until the last overlay closes.
 */
let retained = 0

/** Retain the expanded overlay layer; call the returned function to release. */
export function retainOverlay(): () => void {
  retained += 1
  if (retained === 1) void window.voyager.ui.setOverlayOpen(true)

  let released = false
  return () => {
    if (released) return
    released = true
    retained -= 1
    if (retained === 0) void window.voyager.ui.setOverlayOpen(false)
  }
}

/** Keep the chrome view expanded for as long as `open` is true. */
export function useOverlaySignal(open: boolean): void {
  useEffect(() => {
    if (!open) return
    return retainOverlay()
  }, [open])
}
