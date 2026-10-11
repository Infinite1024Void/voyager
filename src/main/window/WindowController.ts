import { join } from 'node:path'
import { BaseWindow, WebContentsView } from 'electron'
import { IpcChannels } from '../../shared/ipc-channels'
import type { BrowserState } from '../../shared/types'
import { getSettings, sessionStore } from '../store'
import { toggleBookmarksBar } from '../bookmarks/bookmarks'
import { TabManager } from '../tabs/TabManager'
import {
  DEFAULT_CHROME_HEIGHT,
  bookmarksBarExtent,
  computeLayout,
  type WindowLayout
} from './ChromeLayout'

/**
 * Owns the single application window: a frameless BaseWindow whose chrome UI
 * (tab strip + toolbar) lives in a fixed-height WebContentsView pinned to the
 * top, with the active tab's WebContentsView filling the space below.
 */
export class WindowController {
  readonly window: BaseWindow
  readonly chrome: WebContentsView
  readonly tabs: TabManager

  private readonly tabViews = new Set<WebContentsView>()
  private activeTabView: WebContentsView | null = null
  private chromeHeight = DEFAULT_CHROME_HEIGHT
  private overlayOpen = false
  private layout: WindowLayout
  private disposed = false

  constructor() {
    this.layout = computeLayout(1280, 800)

    this.window = new BaseWindow({
      width: 1280,
      height: 800,
      minWidth: 640,
      minHeight: 480,
      show: false,
      title: 'Voyager',
      backgroundColor: '#1a1b22',
      ...(process.platform === 'darwin'
        ? { titleBarStyle: 'hiddenInset' as const, trafficLightPosition: { x: 8, y: 13 } }
        : { frame: false as const })
    })

    this.chrome = new WebContentsView({
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })
    // Transparent so the page shows through when the chrome expands to host
    // an overlay (dropdown / palette / menu) below the toolbar.
    this.chrome.setBackgroundColor('#00000000')

    this.tabs = new TabManager(this, (state) => {
      this.sendToChrome(IpcChannels.TabsStateChanged, state)
      this.persistSession(state)
    })

    this.window.contentView.addChildView(this.chrome)

    // Re-lay out on every way the window can change shape, including native
    // fullscreen which does not always emit a plain 'resize' on macOS.
    this.window.on('resize', this.handleWindowShapeChange)
    this.window.on('maximize', this.handleWindowShapeChange)
    this.window.on('unmaximize', this.handleWindowShapeChange)
    this.window.on('enter-full-screen', this.handleWindowShapeChange)
    this.window.on('leave-full-screen', this.handleWindowShapeChange)

    this.window.on('closed', () => {
      this.disposed = true
    })
    this.setBookmarksBarVisible(getSettings('bookmarksBarVisible') ?? false)
    this.applyLayout()
  }

  /** Grow or shrink the chrome region for the bookmarks bar. */
  setBookmarksBarVisible(visible: boolean): void {
    this.setChromeHeight(DEFAULT_CHROME_HEIGHT + bookmarksBarExtent(visible))
  }

  /** Flip the bookmarks bar and tell the chrome renderer about the new state. */
  toggleBookmarksBar(): void {
    toggleBookmarksBar(
      (state) => this.sendToChrome(IpcChannels.BookmarksStateChanged, state),
      (visible) => this.setBookmarksBarVisible(visible)
    )
  }

  /** Grow or shrink the chrome region (e.g. when the bookmarks bar toggles). */
  setChromeHeight(height: number): void {
    this.chromeHeight = height
    this.applyLayout()
  }

  /**
   * Expand the chrome view over the whole window while an overlay is open so
   * dropdowns, palettes and menus are not clipped to the chrome strip. The
   * chrome background is transparent, so the page remains visible underneath.
   */
  setOverlayOpen(open: boolean): void {
    if (this.overlayOpen === open) return
    this.overlayOpen = open
    this.applyLayout()
  }

  attachTabView(view: WebContentsView): void {
    this.tabViews.add(view)
    this.window.contentView.addChildView(view)
    // Keep chrome topmost so expanded overlays always render above the page.
    this.window.contentView.addChildView(this.chrome)
    this.applyLayout()
  }

  detachTabView(view: WebContentsView): void {
    this.tabViews.delete(view)
    this.window.contentView.removeChildView(view)
    if (this.activeTabView === view) {
      this.activeTabView = null
    }
    this.applyLayout()
  }

  hideTabView(view: WebContentsView): void {
    view.setVisible(false)
  }

  showTabView(view: WebContentsView): void {
    this.activeTabView = view
    for (const other of this.tabViews) {
      other.setVisible(other === view)
    }
    view.webContents.focus()
    this.applyLayout()
  }

  /** Send an event to the chrome renderer process. */
  sendToChrome(channel: string, payload?: unknown): void {
    if (this.disposed) return
    this.chrome.webContents.send(channel, payload)
  }

  onDestroyed(callback: () => void): void {
    this.window.once('closed', callback)
  }

  /** Load the chrome renderer, restore the last session, and reveal the window. */
  async show(): Promise<void> {
    const devServerUrl = process.env['ELECTRON_RENDERER_URL']
    if (devServerUrl) {
      await this.chrome.webContents.loadURL(devServerUrl)
    } else {
      await this.chrome.webContents.loadFile(join(__dirname, '../renderer/index.html'))
    }
    this.restoreSession()
    this.window.show()
  }

  /** Replay the persisted tab set, falling back to a single blank tab. */
  private restoreSession(): void {
    const { tabs, activeIndex } = sessionStore.snapshot
    if (tabs.length === 0) {
      this.tabs.create()
      return
    }
    const ids: string[] = []
    for (const tab of tabs) {
      const id = this.tabs.create({ url: tab.url, active: false })
      if (tab.pinned) this.tabs.pinToggle(id)
      ids.push(id)
    }
    const index = Math.min(Math.max(activeIndex, 0), ids.length - 1)
    if (ids[index]) this.tabs.activate(ids[index])
  }

  /** Save the current tab set so the next launch can restore it. */
  private persistSession(state: BrowserState): void {
    if (this.disposed) return
    const entries = state.tabs.map((tab) => ({
      url: tab.url,
      title: tab.title,
      pinned: tab.pinned
    }))
    const activeIndex = Math.max(
      0,
      state.tabs.findIndex((tab) => tab.id === state.activeTabId)
    )
    sessionStore.set('tabs', entries)
    sessionStore.set('activeIndex', activeIndex)
  }

  /** Recompute chrome + content regions from the window's current size. */
  private handleWindowShapeChange = (): void => {
    this.applyLayout()
  }

  private applyLayout(): void {
    if (this.disposed) return
    const [width, height] = this.window.getContentSize()
    this.layout = computeLayout(width, height, this.chromeHeight)
    this.chrome.setBounds({
      x: 0,
      y: 0,
      width: this.layout.width,
      // Overlay mode spans the window so popups escape the chrome strip.
      height: this.overlayOpen ? this.layout.height : this.layout.chromeHeight
    })
    this.activeTabView?.setBounds({
      x: 0,
      y: this.layout.contentY,
      width: this.layout.width,
      height: this.layout.contentHeight
    })
  }
}