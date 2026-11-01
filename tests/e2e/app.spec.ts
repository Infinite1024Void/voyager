import { expect, test } from './fixtures'
import { chromeBounds, windowCount } from './helpers/voyager'

test('boots a single empty tab in a frameless Voyager window', async ({ voyager }) => {
  await expect(voyager.chrome).toHaveTitle('Voyager')

  const state = await voyager.state()
  expect(state.activeTabId).not.toBeNull()
  expect(state.tabs).toHaveLength(1)
  expect(state.tabs[0]).toMatchObject({
    title: 'New Tab',
    url: 'about:blank',
    loading: false,
    canGoBack: false,
    canGoForward: false,
    pinned: false,
    muted: false,
    crashed: false
  })

  await expect(voyager.chrome.getByRole('tab')).toHaveCount(1)
  await expect(voyager.chrome.getByRole('tab')).toHaveAttribute('aria-selected', 'true')
  await expect(voyager.chrome.locator('#omnibox-input')).toHaveValue('')
  await expect(voyager.chrome.locator('#omnibox-input')).toHaveAttribute(
    'placeholder',
    'Search or enter address'
  )

  await expect(voyager.chrome.getByRole('button', { name: 'Back' })).toBeDisabled()
  await expect(voyager.chrome.getByRole('button', { name: 'Forward' })).toBeDisabled()
  await expect(voyager.chrome.getByRole('button', { name: 'Reload' })).toBeEnabled()
  await expect(voyager.chrome.getByRole('button', { name: 'Bookmark this page' })).toBeDisabled()
  await expect(voyager.chrome.getByRole('button', { name: 'New tab', exact: true })).toBeEnabled()
  await expect(voyager.chrome.getByRole('button', { name: 'Settings' })).toBeEnabled()
  await expect(voyager.chrome.getByRole('button', { name: 'Downloads' })).toBeEnabled()

  expect(voyager.tab.url()).toBe('about:blank')
  expect(voyager.tab).not.toBe(voyager.chrome)
})

test('sizes the chrome strip above the active tab content', async ({ voyager }) => {
  const [width, height] = await voyager.app.evaluate(({ BaseWindow }) => {
    const window = BaseWindow.getAllWindows().find((candidate) => !candidate.isDestroyed())
    if (!window) throw new Error('No window')
    return window.getContentSize()
  })
  const bounds = await chromeBounds(voyager)

  expect(width).toBeGreaterThanOrEqual(1200)
  expect(height).toBeGreaterThanOrEqual(700)
  expect(bounds).toMatchObject({ x: 0, y: 0, width, height: 84 })
  expect(await windowCount(voyager.app)).toBe(1)
})

test('starts with no overlays open', async ({ voyager }) => {
  await expect(voyager.chrome.locator('input[placeholder="Find in page"]')).toHaveCount(0)
  await expect(voyager.chrome.locator('input[placeholder="Search history"]')).toHaveCount(0)
  await expect(voyager.chrome.locator('input[placeholder="Search downloads"]')).toHaveCount(0)
  await expect(voyager.chrome.locator('input[placeholder="Search tabs"]')).toHaveCount(0)
  await expect(voyager.chrome.getByRole('menu')).toHaveCount(0)
})
