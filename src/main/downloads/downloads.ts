import { randomUUID } from 'node:crypto'
import type { Session } from 'electron'
import type { DownloadItem, DownloadsState } from '../../shared/types'
import { downloadsStore } from '../store'

const trackedSessions = new WeakSet<Session>()

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

export function attachDownloadsTracking(session: Session, broadcast: (state: DownloadsState) => void): void {
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
      startTime: Date.now()
    }
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
        startTime: download.startTime,
        endTime: undefined,
        path: item.getSavePath() || undefined
      })
      broadcast(currentDownloadsState())
    })

    item.on('done', (_doneEvent, state) => {
      upsertDownload({
        id,
        url: item.getURL(),
        filename: item.getFilename(),
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
        state: state === 'completed' ? 'completed' : state === 'cancelled' ? 'cancelled' : 'interrupted',
        startTime: download.startTime,
        endTime: Date.now(),
        path: item.getSavePath() || undefined
      })
      broadcast(currentDownloadsState())
    })
  })
}
