import { randomUUID } from 'node:crypto'
import { shell, type DownloadItem as ElectronDownloadItem, type Session } from 'electron'
import type { DownloadItem, DownloadsState } from '../../shared/types'
import { downloadsStore, getSettings } from '../store'

const trackedSessions = new WeakSet<Session>()
const activeItems = new Map<string, ElectronDownloadItem>()

export function currentDownloadsState(): DownloadsState {
  const items = downloadsStore.get('items')
  return {
    items: [...items].sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
  }
}

export function upsertDownload(item: DownloadItem): void {
  const items = downloadsStore.get('items')
  const idx = items.findIndex((it) => it.id === item.id)
  if (idx === -1) {
    downloadsStore.update('items', (list) => [item, ...list])
    return
  }
  const next = [...items]
  next[idx] = { ...next[idx], ...item }
  downloadsStore.set('items', next)
}

export function clearDownloads(): void {
  downloadsStore.set('items', [])
}

export function publishDownloads(broadcast: (state: DownloadsState) => void): DownloadsState {
  const state = currentDownloadsState()
  broadcast(state)
  return state
}

function updatePaused(id: string, paused: boolean): void {
  const items = downloadsStore.get('items')
  const idx = items.findIndex((item) => item.id === id)
  if (idx === -1) return
  const next = [...items]
  next[idx] = { ...next[idx], paused }
  downloadsStore.set('items', next)
}

export function pauseDownload(id: string): boolean {
  const item = activeItems.get(id)
  if (!item || item.isPaused() || item.getState() !== 'progressing') return false
  item.pause()
  updatePaused(id, true)
  return true
}

export function resumeDownload(id: string): boolean {
  const item = activeItems.get(id)
  if (!item || !item.isPaused() || !item.canResume()) return false
  item.resume()
  updatePaused(id, false)
  return true
}

export function cancelDownload(id: string): boolean {
  const item = activeItems.get(id)
  if (!item) return false
  item.cancel()
  return true
}

export function removeDownload(id: string): boolean {
  const item = activeItems.get(id)
  if (item) item.cancel()
  activeItems.delete(id)
  const items = downloadsStore.get('items')
  downloadsStore.set(
    'items',
    items.filter((entry) => entry.id !== id)
  )
  return true
}

export function downloadUrl(id: string): string | undefined {
  return downloadsStore.get('items').find((entry) => entry.id === id)?.url
}

export function downloadPath(id: string): string | undefined {
  return downloadsStore.get('items').find((entry) => entry.id === id)?.path
}

export function openDownloadFolder(id: string): boolean {
  const path = downloadPath(id)
  if (!path) return false
  shell.showItemInFolder(path)
  return true
}

function openWhenDone(item: ElectronDownloadItem): void {
  if (getSettings('openDownloadsWhenDone', false) !== true) return
  const path = item.getSavePath()
  if (path) void shell.openPath(path)
}

export function attachDownloadsTracking(
  session: Session,
  broadcast: (state: DownloadsState) => void
): void {
  if (trackedSessions.has(session)) return
  trackedSessions.add(session)

  session.on('will-download', (_event, item) => {
    const id = randomUUID()
    const download: DownloadItem = {
      id,
      url: item.getURL(),
      filename: item.getFilename(),
      receivedBytes: item.getReceivedBytes(),
      totalBytes: item.getTotalBytes(),
      state: 'progressing',
      paused: false,
      startTime: Date.now()
    }
    activeItems.set(id, item)
    upsertDownload(download)
    broadcast(currentDownloadsState())

    item.on('updated', () => {
      upsertDownload({
        id,
        url: item.getURL(),
        filename: item.getFilename(),
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
        state: 'progressing',
        paused: item.isPaused(),
        startTime: download.startTime,
        endTime: undefined,
        path: item.getSavePath() || undefined
      })
      broadcast(currentDownloadsState())
    })

    item.on('done', (_doneEvent, state) => {
      activeItems.delete(id)
      upsertDownload({
        id,
        url: item.getURL(),
        filename: item.getFilename(),
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
        state:
          state === 'completed' ? 'completed' : state === 'cancelled' ? 'cancelled' : 'interrupted',
        paused: false,
        startTime: download.startTime,
        endTime: Date.now(),
        path: item.getSavePath() || undefined
      })
      broadcast(currentDownloadsState())
      if (state === 'completed') openWhenDone(item)
    })
  })
}
