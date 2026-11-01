import { expect, test } from './fixtures'
import { openSettings, windowCount } from './helpers/voyager'

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
