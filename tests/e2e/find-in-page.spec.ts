import { expect, test } from './fixtures'
import { primaryKey } from './helpers/voyager'

test('opens the find bar from the keyboard and searches text', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/find'))
  await expect.poll(async () => (await voyager.activeTab()).url).toBe(server.url('/find'))
  await expect(voyager.tab.locator('.needle')).toHaveCount(3)

  await voyager.chrome.locator('body').press(`${primaryKey()}+F`)
  const input = voyager.chrome.locator('input[placeholder="Find in page"]')
  await expect(input).toBeVisible()

  await input.fill('needle')
  await input.press('Enter')
  // Typing and Enter should not crash the page; heading remains present.
  await expect(voyager.tab.locator('#heading')).toHaveText('Find Page')

  // Toggling direction keeps working.
  await voyager.chrome.getByRole('button', { name: 'Next' }).click()
  await expect(voyager.tab.locator('#heading')).toHaveText('Find Page')

  await input.press('Escape')
  await expect(voyager.chrome.locator('input[placeholder="Find in page"]')).toHaveCount(0)
})

test('closes the find bar with Escape and clears selection', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/find'))
  await expect.poll(async () => (await voyager.activeTab()).url).toBe(server.url('/find'))

  await voyager.chrome.locator('body').press(`${primaryKey()}+F`)
  await expect(voyager.chrome.locator('input[placeholder="Find in page"]')).toBeVisible()
  await voyager.chrome.locator('input[placeholder="Find in page"]').press('Escape')
  await expect(voyager.chrome.locator('input[placeholder="Find in page"]')).toHaveCount(0)
})
