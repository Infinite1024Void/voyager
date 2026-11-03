import { app, Menu, nativeImage, type MenuItemConstructorOptions } from 'electron'
import type { WindowController } from '../window/WindowController'
import { getSettings } from '../store'
import { openSettingsWindow } from '../window/settingsWindow'

export function createAppMenu(getController?: () => WindowController | null): void {
  const isMac = process.platform === 'darwin'
  const controller = (): WindowController | null => (getController ? getController() : null)

  const recentClosed: MenuItemConstructorOptions[] =
    controller()
      ?.tabs.getClosedTabs()
      .map((entry, index) => ({
        label: entry.title || entry.url,
        click: () => {
          controller()?.tabs.reopenClosedTab(index)
        }
      })) ?? []
  if (recentClosed.length === 0) {
    recentClosed.push({ label: 'No Recent Tabs', enabled: false })
  }

  const openHistory = (promptClear: boolean): void => {
    const window = controller()
    const webContents = window?.chrome.webContents
    if (!webContents) return
    void webContents.executeJavaScript(`window.dispatchEvent(new Event("voyager:open-history"))`)
    if (promptClear) {
      void webContents.executeJavaScript(
        `window.dispatchEvent(new CustomEvent("voyager:open-history-clear"))`
      )
    }
  }

  const template: MenuItemConstructorOptions[] = []

  if (isMac) {
    template.push({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Settings…',
          accelerator: 'CmdOrCtrl+Comma',
          icon: nativeImage.createMenuSymbol('gearshape'),
          click: () => openSettingsWindow()
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    })
  }

  template.push({
    label: 'File',
    submenu: [{ role: 'close' }, ...(isMac ? [] : ([{ role: 'quit' }] as const))]
  })

  template.push({
    label: 'Edit',
    submenu: [{ role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }]
  })

  template.push({
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      {
        label: 'Show Bookmarks Bar',
        type: 'checkbox',
        checked: getSettings('bookmarksBarVisible') === true,
        accelerator: 'CmdOrCtrl+Shift+B',
        click: () => {
          const window = getController?.() ?? null
          window?.toggleBookmarksBar()
        }
      }
    ]
  })

  template.push({
    label: 'History',
    submenu: [
      { label: 'Show History', accelerator: 'CmdOrCtrl+Y', click: () => openHistory(false) },
      { type: 'separator' },
      { label: 'Back', accelerator: 'CmdOrCtrl+[', click: () => controller()?.tabs.goBack() },
      { label: 'Forward', accelerator: 'CmdOrCtrl+]', click: () => controller()?.tabs.goForward() },
      { type: 'separator' },
      {
        label: 'Reopen Closed Tab',
        accelerator: 'CmdOrCtrl+Shift+T',
        click: () => controller()?.tabs.reopenLastClosed()
      },
      { label: 'Recently Closed', submenu: recentClosed },
      { type: 'separator' },
      { label: 'Clear History…', click: () => openHistory(true) }
    ]
  })

  template.push({
    label: 'Window',
    submenu: [{ role: 'minimize' }, { role: 'close' }]
  })

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
