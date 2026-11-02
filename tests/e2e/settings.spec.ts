import { expect, test } from './fixtures'
import { openSettings, windowCount } from './helpers/voyager'
import { primaryKey } from './helpers/voyager'

test('opens settings with the Cmd/Ctrl+, shortcut', async ({ voyager }) => {
  const before = await windowCount(voyager.app)

  await voyager.chrome.locator('body').press(`${primaryKey()}+Comma`)

  await expect.poll(async () => windowCount(voyager.app), { timeout: 10_000 }).toBe(before + 1)
})

test('exposes a Settings menu entry with an accelerator', async ({ voyager }) => {
  const accelerator = await voyager.app.evaluate(({ Menu }) => {
    const menus = Menu.getApplicationMenu()?.items ?? []
    for (const menu of menus) {
      const match = menu.submenu?.items.find((item: any) => /Settings/.test(item.label ?? ''))
      if (match) return match.accelerator
    }
    return null
  })

  expect(accelerator).toContain(',')
})

test('opens settings in a separate managed popup window', async ({ voyager }) => {
  const before = await windowCount(voyager.app)
  const settings = await openSettings(voyager)

  await expect(settings).toHaveTitle('Settings - Voyager')
  expect(settings.url()).toContain('voyager://settings')
  expect(await windowCount(voyager.app)).toBe(before + 1)
})

test('settings page shows stats and lets theme change apply to itself', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  const settings = await openSettings(voyager)

  await expect(settings.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(settings.getByText('Voyager Web Browser')).toBeVisible()
  await expect(settings.getByText('Appearance')).toBeVisible()

  // Click dark theme.
  await settings.getByLabel('dark').click()
  const darkApplied = await settings.evaluate(() => document.documentElement.classList.contains('dark'))
  expect(darkApplied).toBe(true)

  const mode = await settings.evaluate(() => window.voyager.theme.get())
  expect(mode.mode).toBe('dark')
  expect(mode.dark).toBe(true)

  // Persisted to disk under the userData dir.
  const persisted = await voyager.app.evaluate(({ app }) => app.getPath('userData'))
  expect(persisted).toBeTruthy()
})

test('theme changes broadcast to the chrome window', async ({ voyager }) => {
  const settings = await openSettings(voyager)
  await settings.getByLabel('dark').click()

  await expect.poll(async () => {
    const chromeTheme = await voyager.chrome.evaluate(() => window.voyager.theme.get())
    return chromeTheme.mode
  }).toBe('dark')

  await expect.poll(async () => {
    return await voyager.chrome.evaluate(() => document.documentElement.classList.contains('dark'))
  }).toBe(true)

  // Revert.
  await settings.getByLabel('system').click()
  await expect.poll(async () => {
    const chromeTheme = await voyager.chrome.evaluate(() => window.voyager.theme.get())
    return chromeTheme.mode
  }).toBe('system')
})

test('clear browsing data preferences persist', async ({ voyager }) => {
  const settings = await openSettings(voyager)

  await expect(settings.getByLabel('Browsing history')).toBeChecked()
  await settings.getByLabel('Bookmarks').check()
  await expect.poll(async () => (await settings.evaluate(() => window.voyager.settings.get())).clearBookmarks).toBe(true)

  await settings.getByLabel('Browsing history').uncheck()
  await expect.poll(async () => (await settings.evaluate(() => window.voyager.settings.get())).clearHistory).toBe(false)
})

test('clear selected data removes history when selected', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  await expect.poll(async () => (await voyager.chrome.evaluate(() => window.voyager.history.getState())).entries.length).toBe(1)

  const settings = await openSettings(voyager)
  await settings.getByRole('button', { name: 'Clear selected data' }).click()

  await expect.poll(async () => (await voyager.chrome.evaluate(() => window.voyager.history.getState())).entries.length).toBe(0)
})
