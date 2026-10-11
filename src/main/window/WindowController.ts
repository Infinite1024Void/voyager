import { join } from 'node:path'
import { BaseWindow, WebContentsView } from 'electron'
import { DEFAULT_CHROME_HEIGHT, computeLayout, type WindowLayout } from './ChromeLayout'

/**
 * Owns the single application window: a frameless BaseWindow whose chrome UI
 * (tab strip + toolbar) lives in a fixed-height WebContentsView pinned to the
 * top, with the active tab's WebContentsView filling the space below.
 */
export class WindowController {
  readonly window: BaseWindow
  readonly chrome: WebContentsView
  private layout: WindowLayout

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

    this.window.contentView.addChildView(this.chrome)
    this.window.on('resize', () => this.applyLayout())
    this.applyLayout()
  }

  /** Recompute chrome + content regions from the window's current size. */
  private applyLayout(): void {
    const [width, height] = this.window.getContentSize()
    this.layout = computeLayout(width, height, DEFAULT_CHROME_HEIGHT)
    this.chrome.setBounds({
      x: 0,
      y: 0,
      width: this.layout.width,
      height: this.layout.chromeHeight
    })
  }

  /** Load the chrome renderer and reveal the window once it paints. */
  async show(): Promise<void> {
    const devServerUrl = process.env['ELECTRON_RENDERER_URL']
    if (devServerUrl) {
      await this.chrome.webContents.loadURL(devServerUrl)
    } else {
      await this.chrome.webContents.loadFile(join(__dirname, '../renderer/index.html'))
    }
    this.window.show()
  }

  onDestroyed(callback: () => void): void {
    this.window.once('closed', callback)
  }
}