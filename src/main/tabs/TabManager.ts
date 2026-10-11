import { randomUUID } from 'node:crypto'
import { WebContentsView, type WebContents } from 'electron'
import { DEFAULT_NEW_TAB_URL } from '../../shared/constants'
import type { BrowserState, NewTabRequest, TabState } from '../../shared/types'
import type { WindowController } from '../window/WindowController'

interface TabEntry {
  id: string
  view: WebContentsView
  title: string
  url: string
  loading: boolean
  favicon: string | null
  pinned: boolean
  muted: boolean
  hasAudio: boolean
  crashed: boolean
}

function isNewTab(url: string): boolean {
  return url === DEFAULT_NEW_TAB_URL || url === ''
}

/**
 * Owns every tab in the window. Each tab is a sandboxed WebContentsView whose
 * lifecycle events are projected into a TabState snapshot; any change is
 * broadcast to the chrome renderer so it always mirrors reality.
 */
export class TabManager {
  private readonly entries = new Map<string, TabEntry>()
  private order: string[] = []
  private activeId: string | null = null

  constructor(
    private readonly window: WindowController,
    private readonly onStateChanged: (state: BrowserState) => void
  ) {}

  get activeTabId(): string | null {
    return this.activeId
  }

  snapshot(): BrowserState {
    const tabs: TabState[] = []
    for (const id of this.order) {
      const entry = this.entries.get(id)
      if (!entry) continue
      const wc = entry.view.webContents
      tabs.push({
        id,
        title: isNewTab(entry.url) ? 'New Tab' : entry.title,
        url: entry.url,
        loading: entry.loading,
        favicon: entry.favicon,
        canGoBack: wc.navigationHistory.canGoBack(),
        canGoForward: wc.navigationHistory.canGoForward(),
        pinned: entry.pinned,
        muted: entry.muted || wc.isAudioMuted(),
        hasAudio: entry.hasAudio,
        crashed: entry.crashed
      })
    }
    return { tabs, activeTabId: this.activeId }
  }

  create(request: NewTabRequest = {}): string {
    const view = new WebContentsView({
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })
    const entry: TabEntry = {
      id: randomUUID(),
      view,
      title: '',
      url: '',
      loading: false,
      favicon: null,
      pinned: false,
      muted: false,
      hasAudio: false,
      crashed: false
    }

    this.entries.set(entry.id, entry)
    this.order.push(entry.id)
    this.window.attachTabView(entry.view)
    this.wireEvents(entry)

    void entry.view.webContents.loadURL(request.url ?? DEFAULT_NEW_TAB_URL)

    if (request.active ?? true) {
      this.activate(entry.id)
    } else {
      this.window.hideTabView(entry.view)
    }
    return entry.id
  }

  activate(id: string): void {
    const entry = this.entries.get(id)
    if (!entry) return
    if (this.activeId === id) {
      entry.view.webContents.focus()
      return
    }
    const previous = this.activeId
    this.activeId = id
    if (previous) {
      const previousEntry = this.entries.get(previous)
      if (previousEntry) this.window.hideTabView(previousEntry.view)
    }
    this.window.showTabView(entry.view)
    this.broadcast()
  }

  close(id: string): void {
    const entry = this.entries.get(id)
    if (!entry) return

    const index = this.order.indexOf(id)
    this.order.splice(index, 1)
    this.entries.delete(id)

    this.window.detachTabView(entry.view)
    entry.view.webContents.close()

    if (this.activeId === id) {
      this.activeId = null
      const nextId = this.order[Math.min(index, this.order.length - 1)]
      if (nextId) {
        this.activate(nextId)
      } else {
        // Never leave the window tab-less; fall back to a fresh tab.
        this.create()
      }
    }
    this.broadcast()
  }

  reorder(ids: string[]): void {
    const known = ids.filter((id) => this.entries.has(id))
    const missing = this.order.filter((id) => !known.includes(id))
    this.order = [...known, ...missing]
    this.normalizeOrder()
    this.broadcast()
  }

  pinToggle(id: string): void {
    const entry = this.entries.get(id)
    if (!entry) return
    entry.pinned = !entry.pinned
    this.normalizeOrder()
    this.broadcast()
  }

  duplicate(id: string): void {
    const entry = this.entries.get(id)
    if (!entry) return
    this.create(isNewTab(entry.url) ? {} : { url: entry.url, active: true })
  }

  goBack(): void {
    const wc = this.activeWebContents()
    if (wc && wc.navigationHistory.canGoBack()) wc.navigationHistory.goBack()
  }

  goForward(): void {
    const wc = this.activeWebContents()
    if (wc && wc.navigationHistory.canGoForward()) wc.navigationHistory.goForward()
  }

  reload(): void {
    this.activeWebContents()?.reload()
  }

  stop(): void {
    this.activeWebContents()?.stop()
  }

  muteToggle(id: string): void {
    const entry = this.entries.get(id)
    if (!entry) return
    entry.muted = !entry.muted
    entry.view.webContents.setAudioMuted(entry.muted)
    this.broadcast()
  }

  closeOthers(id: string): void {
    for (const otherId of [...this.order]) {
      if (otherId !== id) this.close(otherId)
    }
  }

  closeToRight(id: string): void {
    const index = this.order.indexOf(id)
    if (index === -1) return
    for (const otherId of this.order.slice(index + 1)) this.close(otherId)
  }

  /** Pinned tabs always win the leftmost block, in their relative order. */
  private normalizeOrder(): void {
    const pinned = this.order.filter((id) => this.entries.get(id)?.pinned ?? false)
    const rest = this.order.filter((id) => !pinned.includes(id))
    this.order = [...pinned, ...rest]
  }

  private wireEvents(entry: TabEntry): void {
    const wc = entry.view.webContents

    // window.open and target=_blank always become new tabs for now.
    wc.setWindowOpenHandler(() => ({ action: 'deny' }))

    wc.on('page-title-updated', () => {
      entry.title = wc.getTitle()
      this.broadcast()
    })
    wc.on('page-favicon-updated', (_event, favicons) => {
      entry.favicon = favicons[0] ?? null
      this.broadcast()
    })
    wc.on('did-start-loading', () => {
      entry.loading = true
      this.broadcast()
    })
    wc.on('did-stop-loading', () => {
      entry.loading = false
      this.broadcast()
    })
    wc.on('did-navigate', (_event, url) => {
      entry.url = url
      this.broadcast()
    })
    wc.on('did-navigate-in-page', (_event, url, isMainFrame) => {
      if (isMainFrame) {
        entry.url = url
        this.broadcast()
      }
    })
    wc.on('did-fail-load', (_event, _code, _description, url, isMainFrame) => {
      if (isMainFrame) entry.url = url
      this.broadcast()
    })
    wc.on('render-process-gone', () => {
      entry.crashed = true
      this.broadcast()
    })
    wc.on('media-started-playing', () => {
      entry.hasAudio = true
      this.broadcast()
    })
    wc.on('media-paused', () => {
      entry.hasAudio = false
      this.broadcast()
    })
  }

  private broadcast(): void {
    this.onStateChanged(this.snapshot())
  }

  private activeWebContents(): WebContents | null {
    if (this.activeId === null) return null
    return this.entries.get(this.activeId)?.view.webContents ?? null
  }
}