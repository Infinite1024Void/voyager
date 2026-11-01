import { expect, test } from './fixtures'
import { interceptSearch, searchRequests } from './helpers/voyager'

test('shows the active URL and clears it for a new tab', async ({ voyager, server }) => {
  const input = voyager.chrome.locator('#omnibox-input')
  await voyager.navigate(server.url('/home'))
  await expect(input).toHaveValue(server.url('/home'))

  await voyager.chrome.getByRole('button', { name: 'New tab', exact: true }).click()
  await voyager.waitForTab((tab) => tab.url === 'about:blank')
  await expect(input).toHaveValue('')
})

test('selects the whole address when focused', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  const input = voyager.chrome.locator('#omnibox-input')
  await input.focus()

  const selection = await input.evaluate((element) => {
    const field = element as HTMLInputElement
    return { start: field.selectionStart, end: field.selectionEnd, length: field.value.length }
  })

  expect(selection.start).toBe(0)
  expect(selection.end).toBe(selection.length)
  expect(selection.length).toBeGreaterThan(0)
})

test('Escape abandons edits and restores the active URL', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  const input = voyager.chrome.locator('#omnibox-input')

  await input.focus()
  await input.fill('not the real address')
  await expect(input).toHaveValue('not the real address')

  await input.press('Escape')
  await expect(input).toHaveValue(server.url('/home'))
  const focused = await voyager.chrome.evaluate(
    () => document.activeElement?.id === 'omnibox-input'
  )
  expect(focused).toBe(false)
})

test('renders search suggestions and runs the highlighted one', async ({ voyager, server }) => {
  await interceptSearch(voyager, server)
  const input = voyager.chrome.locator('#omnibox-input')

  await input.focus()
  await input.fill('al')
  await expect(voyager.chrome.getByText('alpha suggestion')).toBeVisible()
  await expect(voyager.chrome.getByText('Search DuckDuckGo')).toBeVisible()

  await input.press('ArrowDown')
  await input.press('Enter')

  await voyager.waitForTab(
    (tab) => tab.url === server.url('/search?q=alpha%20suggestion') && !tab.loading
  )
  await expect(voyager.tab.locator('#query')).toHaveText('alpha suggestion')
  expect(await searchRequests(voyager.app)).toContain(
    'https://duckduckgo.com/?q=alpha%20suggestion'
  )
})

test('submits a typed search query when no suggestion is highlighted', async ({
  voyager,
  server
}) => {
  await interceptSearch(voyager, server)
  const input = voyager.chrome.locator('#omnibox-input')

  await input.fill('c++ & rust')
  await input.press('Enter')

  await voyager.waitForTab(
    (tab) => tab.url === server.url('/search?q=c%2B%2B%20%26%20rust') && !tab.loading
  )
  await expect(voyager.tab.locator('#query')).toHaveText('c++ & rust')
  expect(await searchRequests(voyager.app)).toContain(
    'https://duckduckgo.com/?q=c%2B%2B%20%26%20rust'
  )
})

test('describes an insecure HTTP page in the site information popover', async ({
  voyager,
  server
}) => {
  await voyager.navigate(server.url('/home'))
  const badge = voyager.chrome.getByRole('button', { name: 'View site information' })
  await expect(badge).toBeVisible()

  await badge.click()
  await expect(voyager.chrome.getByText('Connection is not secure')).toBeVisible()
  await expect(voyager.chrome.getByText('Use HTTPS to protect your data')).toBeVisible()
  await expect(voyager.chrome.getByText('Local browser tab')).toHaveCount(0)

  await badge.click()
  await expect(voyager.chrome.getByText('Connection is not secure')).toHaveCount(0)
})

test('does not show a site information button for a blank tab', async ({ voyager }) => {
  await expect(voyager.chrome.getByRole('button', { name: 'View site information' })).toHaveCount(0)
  await expect(voyager.chrome.locator('#omnibox-input')).toHaveValue('')
})
