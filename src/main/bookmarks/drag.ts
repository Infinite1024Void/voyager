/**
 * Links dragged out of a tab webContents cannot always expose their URL to
 * the chrome view's cross-view drop event, so the tab preload records the URL
 * here as a fallback. Only one drag is in flight at a time.
 */
let pendingDragUrl: string | null = null

export function setPendingDragUrl(url: string): void {
  pendingDragUrl = typeof url === 'string' && url.length > 0 ? url : null
}

export function consumePendingDragUrl(): string | null {
  const url = pendingDragUrl
  pendingDragUrl = null
  return url
}
