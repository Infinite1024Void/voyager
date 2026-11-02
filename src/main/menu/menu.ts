import { app, Menu, type MenuItemConstructorOptions } from 'electron'
import type { WindowController } from '../window/WindowController'
import { getSettings } from '../store'

export function createAppMenu(getController?: () => WindowController | null): void {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = []

  if (isMac) {
    template.push({
      label: app.name,
      submenu: [
        { role: 'about' },
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
    label: 'Window',
    submenu: [{ role: 'minimize' }, { role: 'close' }]
  })

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
