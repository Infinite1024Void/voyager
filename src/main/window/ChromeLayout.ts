export const TAB_STRIP_HEIGHT = 40
export const TOOLBAR_HEIGHT = 44
export const BOOKMARKS_BAR_HEIGHT = 30
export const DEFAULT_CHROME_HEIGHT = TAB_STRIP_HEIGHT + TOOLBAR_HEIGHT

export interface WindowLayout {
  width: number
  height: number
  chromeHeight: number
  contentY: number
  contentHeight: number
}

/** Height in px reserved for the bookmarks bar region, or 0 when hidden. */
export function bookmarksBarExtent(bookmarksVisible: boolean): number {
  return bookmarksVisible ? BOOKMARKS_BAR_HEIGHT : 0
}

export function computeLayout(
  width: number,
  height: number,
  chromeHeight: number = DEFAULT_CHROME_HEIGHT
): WindowLayout {
  return {
    width,
    height,
    chromeHeight,
    contentY: chromeHeight,
    contentHeight: Math.max(0, height - chromeHeight)
  }
}
