import { app } from 'electron'
import { WindowController } from './window/WindowController'

app.setName('Voyager')

let controller: WindowController | null = null

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