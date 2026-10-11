import { app } from 'electron'
import { registerIpcHandlers } from './ipc/register'
import { WindowController } from './window/WindowController'

app.setName('Voyager')

let controller: WindowController | null = null

registerIpcHandlers({
  send: (channel, payload) => {
    controller?.sendToChrome(channel, payload)
  }
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