import { expect, test } from './fixtures'
import { clipboardText, primaryKey, pressPageShortcut } from './helpers/voyager'
import { join } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'

test('tracks a completed download and writes the file', async ({
  voyager,
  server,
  downloadDir
}) => {
  await voyager.navigate(server.url('/home'))
  await expect.poll(async () => (await voyager.activeTab()).url).toBe(server.url('/home'))

  // Trigger a download in the page web contents.
  await voyager.tab.getByRole('link', { name: 'Download file' }).click()

  await expect
    .poll(
      async () => {
        const state = await voyager.chrome.evaluate(() => window.voyager.downloads.getState())
        return state.items.length
      },
      { timeout: 20_000 }
    )
    .toBe(1)

  await expect
    .poll(
      async () => {
        const state = await voyager.chrome.evaluate(() => window.voyager.downloads.getState())
        return state.items[0].state
      },
      { timeout: 20_000 }
    )
    .toBe('completed')

  const items = (await voyager.chrome.evaluate(() => window.voyager.downloads.getState())).items
  expect(items[0].filename).toBe('voyager-test.txt')
  expect(items[0].receivedBytes).toBeGreaterThan(0)

  const savedPath = join(downloadDir, 'voyager-test.txt')
  await expect.poll(() => existsSync(savedPath), { timeout: 20_000 }).toBe(true)
  expect(readFileSync(savedPath, 'utf8')).toContain('voyager download payload')
})

test('tracks a completed download once even with multiple tabs open', async ({
  voyager,
  server,
  downloadDir
}) => {
  await voyager.navigate(server.url('/home'))
  await expect.poll(async () => (await voyager.activeTab()).url).toBe(server.url('/home'))

  await pressPageShortcut(voyager, 't', ['meta'])
  await voyager.navigate(server.url('/home'))
  await expect.poll(async () => (await voyager.activeTab()).url).toBe(server.url('/home'))

  expect((await voyager.state()).tabs.length).toBeGreaterThanOrEqual(2)

  await voyager.tab.getByRole('link', { name: 'Download file' }).click()

  // A single download must be recorded exactly once regardless of open tabs.
  await expect
    .poll(
      async () => {
        const state = await voyager.chrome.evaluate(() => window.voyager.downloads.getState())
        return state.items.length
      },
      { timeout: 20_000 }
    )
    .toBe(1)

  await expect
    .poll(
      async () => {
        const state = await voyager.chrome.evaluate(() => window.voyager.downloads.getState())
        return state.items[0].state
      },
      { timeout: 20_000 }
    )
    .toBe('completed')

  const savedPath = join(downloadDir, 'voyager-test.txt')
  await expect.poll(() => existsSync(savedPath), { timeout: 20_000 }).toBe(true)
})

test('pauses, resumes, and cancels an active download', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  await voyager.tab.getByRole('link', { name: 'Download large file' }).click()

  await expect
    .poll(
      async () => {
        const state = await voyager.chrome.evaluate(() => window.voyager.downloads.getState())
        return state.items.length
      },
      { timeout: 20_000 }
    )
    .toBe(1)

  await voyager.chrome.locator('body').press(`${primaryKey()}+Shift+J`)
  await expect(voyager.chrome.getByText('voyager-slow.txt', { exact: true })).toBeVisible()

  await voyager.chrome.getByRole('button', { name: 'Pause download' }).click()
  await expect
    .poll(
      async () => {
        const state = await voyager.chrome.evaluate(() => window.voyager.downloads.getState())
        return state.items[0]?.paused
      },
      { timeout: 10_000 }
    )
    .toBe(true)
  await expect(voyager.chrome.getByRole('button', { name: 'Resume download' })).toBeVisible()

  await voyager.chrome.getByRole('button', { name: 'Resume download' }).click()
  await expect
    .poll(
      async () => {
        const state = await voyager.chrome.evaluate(() => window.voyager.downloads.getState())
        return state.items[0]?.paused
      },
      { timeout: 10_000 }
    )
    .toBe(false)

  await voyager.chrome.getByRole('button', { name: 'Cancel download' }).click()
  await expect
    .poll(
      async () => {
        const state = await voyager.chrome.evaluate(() => window.voyager.downloads.getState())
        return state.items[0]?.state
      },
      { timeout: 10_000 }
    )
    .toBe('cancelled')
})

test('persists the open-when-done preference', async ({ voyager }) => {
  const preferences = await voyager.chrome.evaluate(async () => {
    await window.voyager.settings.set('openDownloadsWhenDone', true)
    return window.voyager.settings.get()
  })

  expect(preferences.openDownloadsWhenDone).toBe(true)
})

test('shows aggregate download progress on the toolbar button', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  await voyager.tab.getByRole('link', { name: 'Download large file' }).click()

  const button = voyager.chrome.getByRole('button', { name: /Downloads/ })

  await expect
    .poll(async () => button.getAttribute('aria-valuenow'), { timeout: 20_000 })
    .not.toBeNull()

  await expect
    .poll(async () => button.getAttribute('aria-valuenow'), { timeout: 20_000 })
    .toBeNull()
})

test('offers a context menu and removes the selected download', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  await voyager.tab.getByRole('link', { name: 'Download file' }).click()

  await expect
    .poll(
      async () => {
        const state = await voyager.chrome.evaluate(() => window.voyager.downloads.getState())
        return state.items[0]?.state
      },
      { timeout: 20_000 }
    )
    .toBe('completed')

  await voyager.chrome.locator('body').press(`${primaryKey()}+Shift+J`)
  const row = voyager.chrome.getByText('voyager-test.txt', { exact: true })
  await expect(row).toBeVisible()
  await row.click({ button: 'right' })

  await expect(voyager.chrome.getByRole('menuitem', { name: 'Remove from History' })).toBeVisible()
  await expect(voyager.chrome.getByRole('menuitem', { name: 'Copy Download URL' })).toBeVisible()
  const openFolderItem = voyager.chrome.getByRole('menuitem', { name: 'Open in Folder' })
  await expect(openFolderItem).toBeVisible()
  await expect(openFolderItem).toBeEnabled()

  const itemId = (await voyager.chrome.evaluate(() => window.voyager.downloads.getState())).items[0]
    .id
  void itemId

  await voyager.chrome.getByRole('menuitem', { name: 'Copy Download URL' }).click()
  await expect
    .poll(async () => clipboardText(voyager.app))
    .toBe(server.url('/download?name=voyager-test.txt'))

  await row.click({ button: 'right' })
  await voyager.chrome.getByRole('menuitem', { name: 'Remove from History' }).click()
  await expect
    .poll(
      async () =>
        (await voyager.chrome.evaluate(() => window.voyager.downloads.getState())).items.length
    )
    .toBe(0)
})

test('downloads panel surfaces items and clears them', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  await voyager.tab.getByRole('link', { name: 'Download file' }).click()

  await expect
    .poll(
      async () => {
        const state = await voyager.chrome.evaluate(() => window.voyager.downloads.getState())
        return state.items.length
      },
      { timeout: 20_000 }
    )
    .toBe(1)

  await voyager.chrome.locator('body').press(`${primaryKey()}+Shift+J`)
  await expect(voyager.chrome.getByPlaceholder('Search downloads')).toBeVisible()
  await expect(voyager.chrome.getByText('voyager-test.txt', { exact: true })).toBeVisible()

  // Clear downloads clears the tracked items.
  await voyager.chrome.getByRole('button', { name: 'Clear' }).click()
  await expect
    .poll(
      async () =>
        (await voyager.chrome.evaluate(() => window.voyager.downloads.getState())).items.length
    )
    .toBe(0)
  await expect(voyager.chrome.getByText('No downloads')).toBeVisible()
})
