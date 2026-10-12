import { app, Menu, type MenuItemConstructorOptions } from 'electron'

export function createAppMenu(): void {
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
    submenu: [{ role: 'close' }, ...(isMac ? [] : ([{ role: 'quit' }] as const)) ]
  })

  template.push({
    label: 'Edit',
    submenu: [{ role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }]
  })

  template.push({
    label: 'View',
    submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }]
  })

  template.push({
    label: 'Window',
    submenu: [{ role: 'minimize' }, { role: 'close' }]
  })

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
