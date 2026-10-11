import { contextBridge } from 'electron'

const api = {
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }
}

contextBridge.exposeInMainWorld('voyager', api)

export type VoyagerApi = typeof api
