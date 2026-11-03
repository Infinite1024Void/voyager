import { ipcRenderer } from 'electron'
import { IpcChannels } from '../shared/ipc-channels'

/**
 * Record the URL of any link being dragged out of the page. The bookmark bar
 * consumes this if the cross-view DataTransfer arrives empty.
 */
window.addEventListener(
  'dragstart',
  (event) => {
    const path = event.composedPath()
    const anchor = path.find(
      (node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement
    )
    const url = anchor?.href ?? ''
    if (url.length > 0) ipcRenderer.send(IpcChannels.TabDragStart, url)
  },
  true
)

// Clear the fallback when the drag ends without a drop on the bookmarks bar.
window.addEventListener(
  'dragend',
  () => {
    ipcRenderer.send(IpcChannels.TabDragStart, '')
  },
  true
)
