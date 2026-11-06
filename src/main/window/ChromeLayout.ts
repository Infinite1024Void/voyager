import { VERTICAL_TAB_RAIL_COMPACT_WIDTH } from '../../shared/constants'

export const TAB_STRIP_HEIGHT = 40
export const TOOLBAR_HEIGHT = 44
export const BOOKMARKS_BAR_HEIGHT = 30
export const DEFAULT_CHROME_HEIGHT = TAB_STRIP_HEIGHT + TOOLBAR_HEIGHT

export interface WindowLayout {
  width: number
  height: number
  chromeHeight: number
  contentX: number
  contentY: number
  contentWidth: number
  contentHeight: number
}

/** Height in px reserved for the bookmarks bar region, or 0 when hidden. */
export function bookmarksBarExtent(bookmarksVisible: boolean): number {
  return bookmarksVisible ? BOOKMARKS_BAR_HEIGHT : 0
}

/**
 * Horizontal space reserved for the vertical rail in the page layout. The rail
 * always occupies its compact width in the layout; hovering expands it as an
 * overlay above the page instead of reflowing the page.
 */
export function verticalRailExtent(vertical: boolean): number {
  return vertical ? VERTICAL_TAB_RAIL_COMPACT_WIDTH : 0
}

export function computeLayout(
  width: number,
  height: number,
  chromeHeight: number = DEFAULT_CHROME_HEIGHT,
  railWidth: number = 0
): WindowLayout {
  return {
    width,
    height,
    chromeHeight,
    contentX: railWidth,
    contentY: chromeHeight,
    contentWidth: Math.max(0, width - railWidth),
    contentHeight: Math.max(0, height - chromeHeight)
  }
}
