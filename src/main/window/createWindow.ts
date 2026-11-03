import { WindowController } from './WindowController'
import { registerWindow } from './windowRegistry'

/** Open another full Voyager window, optionally starting at a URL. */
export function createWindow(initialUrl?: string): WindowController {
  const controller = new WindowController()
  registerWindow(controller)
  void controller.show(initialUrl)
  return controller
}
