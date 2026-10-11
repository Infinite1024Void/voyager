import { app } from 'electron'
import { registerIpcHandlers } from './ipc/register'
import { flushAllStores } from './store/settings'
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

app.whenReady().then(async (): Promise<void> => {
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