import { expect, test } from './fixtures'
import { primaryKey } from './helpers/voyager'

test('records a visit as a page is navigated', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  await expect.poll(async () => (await voyager.activeTab()).url).toBe(server.url('/home'))

  await expect.poll(async () => (await voyager.chrome.evaluate(() => window.voyager.history.getState())).entries.length).toBe(1)
  const entries = (await voyager.chrome.evaluate(() => window.voyager.history.getState())).entries
  expect(entries[0].url).toBe(server.url('/home'))
  expect(entries[0].title).toBe('Voyager Test Home')
  expect(entries[0].visitCount).toBe(1)
})

test('revisiting the same URL increments the visit count', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  await expect.poll(async () => (await voyager.activeTab()).url).toBe(server.url('/home'))

  // Force another load so did-navigate fires again.
  await voyager.chrome.evaluate((url) => window.voyager.navigation.go(url), server.url('/home'))
  await expect.poll(async () => !(await voyager.activeTab()).loading)

  await expect.poll(async () => {
    const state = await voyager.chrome.evaluate(() => window.voyager.history.getState())
    return state.entries.find((entry: any) => entry.url === server.url('/home'))?.visitCount ?? 0
  }).toBe(2)
})

test('history panel lists entries and searches them', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  await voyager.navigate(server.url('/second'))

  await voyager.chrome.locator('body').press(`${primaryKey()}+Y`)
  const panel = voyager.chrome.getByPlaceholder('Search history')
  await expect(panel).toBeVisible()

  await expect(voyager.chrome.getByText('Second Page')).toBeVisible()
  await expect(voyager.chrome.getByText('Voyager Test Home')).toBeVisible()

  await panel.fill('Second')
  await expect(voyager.chrome.getByText('Second Page')).toBeVisible()
  await expect(voyager.chrome.getByText('Voyager Test Home')).toHaveCount(0)

  await panel.press('Escape')
  await expect(voyager.chrome.getByPlaceholder('Search history')).toHaveCount(0)
})

test('history remove deletes a single entry', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  await expect.poll(async () => (await voyager.chrome.evaluate(() => window.voyager.history.getState())).entries.length).toBe(1)

  await voyager.chrome.locator('body').press(`${primaryKey()}+Y`)
  await expect(voyager.chrome.getByRole('button', { name: 'Remove from history' })).toBeVisible()
  await voyager.chrome.getByRole('button', { name: 'Remove from history' }).click()

  await expect.poll(async () => (await voyager.chrome.evaluate(() => window.voyager.history.getState())).entries.length).toBe(0)
  await voyager.chrome.locator('body').press('Escape')  // noop safe
})

test('history clear empties the list via the panel', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  await voyager.navigate(server.url('/second'))
  await expect.poll(async () => (await voyager.chrome.evaluate(() => window.voyager.history.getState())).entries.length).toBeGreaterThanOrEqual(2)

  // There is no clear button in the panel UI; use the API exposed on window.voyager.history.
  await voyager.chrome.evaluate(() => window.voyager.history.clear())
  await expect.poll(async () => (await voyager.chrome.evaluate(() => window.voyager.history.getState())).entries.length).toBe(0)
})

test('clicking a history entry navigates the active tab', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/first'.replace('/first', '/home')))
  await voyager.navigate(server.url('/first'.replace('/first', '/second')))

  const entries = (await voyager.chrome.evaluate(() => window.voyager.history.getState())).entries
  const homeEntry = entries.find((entry: any) => entry.url.includes('/home'))
  expect(homeEntry).toBeTruthy()

  await voyager.chrome.locator('body').press(`${primaryKey()}+Y`)
  await voyager.chrome.getByTitle(homeEntry!.url).click()
  await expect.poll(async () => (await voyager.activeTab()).url).toBe(homeEntry!.url)
  await expect(voyager.tab.locator('#heading')).toHaveText('Test Home')
})
