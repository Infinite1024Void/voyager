import { app, protocol, session } from 'electron'
import { join } from 'node:path'
import { registerIpcHandlers } from './ipc/register'
import { flushAllStores } from './store'
import { WindowController } from './window/WindowController'
import { attachDownloadsTracking } from './downloads/downloads'
import { IpcChannels } from '../shared/ipc-channels'

app.setName('Voyager')

// Must run before the app is ready. Registering the settings scheme as
// standard + secure lets relative asset URLs resolve and CORS-enabled module
// scripts load from voyager:// .
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'voyager',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
])

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
    if (url.startsWith('assets/')) {
      callback({ path: join(__dirname, '../renderer/assets/', url.substring('assets/'.length)) })
      return
    }
    if (url === '' || url === '/') {
      callback({ path: join(__dirname, '../renderer/', 'index.html') })
      return
    }
    callback({ path: join(__dirname, '../renderer/', url) })
  })

  controller = new WindowController()
  createAppMenu(() => controller)
  controller.onDestroyed(() => {
    controller = null
  })
  attachDownloadsTracking(session.defaultSession, (state) =>
    controller?.sendToChrome(IpcChannels.DownloadsStateChanged, state)
  )
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
