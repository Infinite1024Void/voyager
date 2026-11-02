import { expect, test } from './fixtures'
import { windowCount } from './helpers/voyager'

test('opening a tab page keeps Node and preload globals absent', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  await expect.poll(async () => (await voyager.activeTab()).url).toBe(server.url('/home'))

  const globals = await voyager.tab.evaluate(() => ({
    require: 'require' in window,
    process: 'process' in window,
    module: 'module' in window,
    voyager: 'voyager' in window
  }))
  expect(globals).toEqual({ require: false, process: false, module: false, voyager: false })
})

test('popups stay inside the browser instead of spawning a native window', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  await expect.poll(async () => (await voyager.activeTab()).url).toBe(server.url('/home'))

  const before = await windowCount(voyager.app)
  await voyager.tab.getByRole('link', { name: 'Open popup' }).click()
  await expect.poll(async () => (await voyager.state()).tabs.length).toBeGreaterThan(1)
  expect(await windowCount(voyager.app)).toBe(before)
})

test('voyager://settings links open the managed settings window', async ({ voyager, server }) => {
  await voyager.navigate(server.url('/home'))
  await expect.poll(async () => (await voyager.activeTab()).url).toBe(server.url('/home'))

  const tabsBefore = (await voyager.state()).tabs.length
  await voyager.tab.getByRole('link', { name: 'Open settings' }).click({ noWaitAfter: true })
  await expect.poll(async () => windowCount(voyager.app)).toBeGreaterThanOrEqual(2)
  // Ensure no new tab opened for settings.
  expect((await voyager.state()).tabs.length).toBe(tabsBefore)
})
