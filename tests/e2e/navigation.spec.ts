import { expect, test } from './fixtures'
import {
  activeZoom,
  devToolsOpen,
  interceptSearch,
  pressPageShortcut,
  primaryModifier,
  searchRequests
} from './helpers/voyager'

test('navigates from the omnibox and reflects the page title', async ({ voyager, server }) => {
  const input = voyager.chrome.locator('#omnibox-input')
  await input.fill(server.url('/home'))
  await input.press('Enter')

  await voyager.waitForTab((candidate) => candidate.url === server.url('/home'))
  await expect.poll(async () => (await voyager.activeTab()).title, { timeout: 15_000 }).toBe('Voyager Test Home')
  await expect(voyager.tab.locator('#heading')).toHaveText('Test Home')
  await expect(input).toHaveValue(server.url('/home'))
})

test('treats a bare host and port as an HTTP address', async ({ voyager, server }) => {
  const host = server.origin.replace('http://', '')
  const input = voyager.chrome.locator('#omnibox-input')
  await input.fill(`${host}/home`)
  await input.press('Enter')

  const tab = await voyager.waitForTab((candidate) => candidate.url === server.url('/home'))
  expect(tab.url).toBe(server.url('/home'))
  await expect(voyager.tab.locator('#heading')).toHaveText('Test Home')
})

test('resolves search queries through DuckDuckGo', async ({ voyager, server }) => {
  await interceptSearch(voyager, server)

  const input = voyager.chrome.locator('#omnibox-input')
  await input.fill('hello world')
  await input.press('Enter')

  await voyager.waitForTab((candidate) => candidate.url === server.url('/search?q=hello%20world'))
  await expect(voyager.tab.locator('#query')).toHaveText('hello world')

  const requests = await searchRequests(voyager.app)
  expect(requests).toContain('https://duckduckgo.com/?q=hello%20world')
})

test('navigates back, forward and reloads from the toolbar', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  await voyager.navigate(server.url('/second'))

  const back = voyager.chrome.getByRole('button', { name: 'Back' })
  const forward = voyager.chrome.getByRole('button', { name: 'Forward' })
  await expect(back).toBeEnabled()
  await expect(forward).toBeDisabled()

  await back.click()
  await voyager.waitForTab((tab) => tab.url === server.url('/home'))
  await expect(voyager.tab.locator('#heading')).toHaveText('Test Home')
  await expect(forward).toBeEnabled()

  await forward.click()
  await voyager.waitForTab((tab) => tab.url === server.url('/second'))
  await expect(voyager.tab.locator('#heading')).toHaveText('Second Page')

  const before = server.hits('/second')
  await voyager.chrome.getByRole('button', { name: 'Reload' }).click()
  await expect.poll(() => server.hits('/second')).toBeGreaterThan(before)
  await voyager.waitForTab((tab) => tab.url === server.url('/second') && !tab.loading)
})

test('supports back and forward shortcuts while the page has focus', async ({
  voyager,
  server
}) => {
  await voyager.navigate(server.url('/home'))
  await voyager.navigate(server.url('/second'))

  await pressPageShortcut(voyager, '[', [primaryModifier()])
  await voyager.waitForTab((tab) => tab.url === server.url('/home'))

  await pressPageShortcut(voyager, ']', [primaryModifier()])
  await voyager.waitForTab((tab) => tab.url === server.url('/second'))
})

test('follows redirects and records the final URL', async ({ voyager, server }) => {
  await voyager.chrome.evaluate((url) => window.voyager.navigation.go(url), server.url('/redirect'))

  await voyager.waitForTab((candidate) => candidate.url === server.url('/second'))
  await expect.poll(async () => (await voyager.activeTab()).title).toBe('Second Page')
  expect(server.hits('/redirect')).toBe(1)
  expect(server.hits('/second')).toBeGreaterThanOrEqual(1)
})

test('stops a slow navigation from the toolbar', async ({ voyager, server }) => {
  const slowUrl = server.url('/slow?ms=5000')
  await voyager.chrome.evaluate((url) => window.voyager.navigation.go(url), slowUrl)
  await expect.poll(async () => (await voyager.activeTab()).loading).toBe(true)

  await voyager.chrome.getByRole('button', { name: 'Stop' }).click()
  await expect.poll(async () => (await voyager.activeTab()).loading).toBe(false)

  await new Promise((resolve) => setTimeout(resolve, 6500))
  await expect(voyager.tab.locator('#heading')).toHaveCount(0)
  expect((await voyager.activeTab()).title).not.toBe('Slow Page')

  await voyager.navigate(server.url('/home'))
  await voyager.waitForTab((tab) => !tab.loading)
  await expect(voyager.tab.locator('#heading')).toHaveText('Test Home')
})

test('zooms in, out and resets the active tab', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  expect(Math.round((await activeZoom(voyager)) * 100)).toBe(100)

  await voyager.chrome.evaluate(() => window.voyager.navigation.zoomIn())
  await voyager.chrome.evaluate(() => window.voyager.navigation.zoomIn())
  await expect.poll(async () => Math.round((await activeZoom(voyager)) * 100)).toBe(120)

  await voyager.chrome.evaluate(() => window.voyager.navigation.zoomOut())
  await expect.poll(async () => Math.round((await activeZoom(voyager)) * 100)).toBe(110)

  await voyager.chrome.evaluate(() => window.voyager.navigation.zoomReset())
  await expect.poll(async () => Math.round((await activeZoom(voyager)) * 100)).toBe(100)
})

test('prints the active tab to a PDF', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  const base64 = await voyager.chrome.evaluate(() => window.voyager.navigation.printToPdf())

  expect(base64).toBeTruthy()
  const pdf = Buffer.from(base64 ?? '', 'base64')
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
})

test('toggles DevTools for the active tab', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  await voyager.chrome.evaluate(() => window.voyager.navigation.toggleDevTools())
  await expect.poll(() => devToolsOpen(voyager.app)).toBe(true)

  await voyager.chrome.evaluate(() => window.voyager.navigation.toggleDevTools())
  await expect.poll(() => devToolsOpen(voyager.app)).toBe(false)
})
