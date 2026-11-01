import { expect, test } from './fixtures'
import { primaryKey } from './helpers/voyager'

test('bookmark bar toggles from the keyboard', async ({ voyager }) => {
  await expect.poll(async () => (await voyager.chrome.evaluate(() => window.voyager.bookmarks.getState())).barVisible).toBe(false)

  const mod = primaryKey()
  await voyager.chrome.locator('body').press(`${mod}+Shift+B`)
  await expect.poll(async () => (await voyager.chrome.evaluate(() => window.voyager.bookmarks.getState())).barVisible).toBe(true)
  await expect(voyager.chrome.locator('nav')).toContainText('Bookmarks you add will live here')

  await voyager.chrome.locator('body').press(`${mod}+Shift+B`)
  await expect.poll(async () => (await voyager.chrome.evaluate(() => window.voyager.bookmarks.getState())).barVisible).toBe(false)
  await expect(voyager.chrome.locator('nav')).toHaveCount(0)
})

test('adds, dedupes, navigates and removes a bookmark', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  await expect.poll(async () => (await voyager.activeTab()).url).toBe(server.url('/home'))

  const bookmarkBtn = voyager.chrome.getByRole('button', { name: 'Bookmark this page' })
  await expect(bookmarkBtn).toBeEnabled()
  await bookmarkBtn.click()
  await expect.poll(async () => (await voyager.chrome.evaluate(() => window.voyager.bookmarks.getState())).items.length).toBe(1)

  // Dedupe.
  await bookmarkBtn.click()
  await expect.poll(async () => (await voyager.chrome.evaluate(() => window.voyager.bookmarks.getState())).items.length).toBe(1)

  // Show bar.
  await voyager.chrome.locator('body').press(`${primaryKey()}+Shift+B`)
  await expect.poll(async () => (await voyager.chrome.evaluate(() => window.voyager.bookmarks.getState())).barVisible).toBe(true)

  const items = (await voyager.chrome.evaluate(() => window.voyager.bookmarks.getState())).items
  expect(items[0].title).toBe('Voyager Test Home')
  expect(items[0].url).toBe(server.url('/home'))

  await voyager.chrome.locator('body').press(`${primaryKey()}+T`)
  await expect.poll(async () => (await voyager.activeTab()).url).toBe('about:blank')

  await voyager.navigate(server.url('/second'))
  await expect.poll(async () => (await voyager.activeTab()).url).toBe(server.url('/second'))

  await voyager.chrome.locator('nav button').first().click()
  await expect.poll(async () => (await voyager.activeTab()).url).toBe(server.url('/home'))

  await voyager.chrome.locator('nav div').first().click({ button: 'right' })
  await expect(voyager.chrome.getByRole('menu')).toBeVisible()
  await voyager.chrome.getByRole('menuitem', { name: 'Remove' }).click()
  await expect.poll(async () => (await voyager.chrome.evaluate(() => window.voyager.bookmarks.getState())).items.length).toBe(0)
})

test('disables bookmark button on a blank tab', async ({ voyager }) => {
  await expect(voyager.chrome.getByRole('button', { name: 'Bookmark this page' })).toBeDisabled()
})
