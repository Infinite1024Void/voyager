import { app, protocol } from 'electron'
import { join } from 'node:path'
import { registerIpcHandlers } from './ipc/register'
import { flushAllStores } from './store'
import { WindowController } from './window/WindowController'

app.setName('Voyager')

let controller: WindowController | null = null

registerIpcHandlers({
  send: (channel, payload) => {
    controller?.sendToChrome(channel, payload)
  },
  getWindow: () => controller
})

// Persist any debounced store writes before the process goes away.
app.on('will-quit', () => {
  flushAllStores()
})

import { createAppMenu } from './menu/menu'

app.whenReady().then(async (): Promise<void> => {
  createAppMenu()

  protocol.registerFileProtocol('voyager', (request, callback) => {
    const url = request.url.replace('voyager://', '')
    if (url === 'settings' || url === 'settings/') {
      callback({ path: join(__dirname, '../renderer/', 'settings.html') })
      return
    }
    if (url.startsWith('settings/')) {
      const relative = url.substring('settings/'.length)
      callback({ path: join(__dirname, '../renderer/', relative) })
      return
    }
    if (url === '' || url === '/') {
      callback({ path: join(__dirname, '../renderer/', 'index.html') })
      return
    }
    callback({ path: join(__dirname, '../renderer/', url) })
  })

  controller = new WindowController()
  controller.onDestroyed(() => {
    controller = null
  })
  await controller.show()
})

app.on('activate', () => {
  if (controller === null) {
    void (async () => {
      controller = new WindowController()
      controller.onDestroyed(() => {
        controller = null
      })
      await controller.show()
    })()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})