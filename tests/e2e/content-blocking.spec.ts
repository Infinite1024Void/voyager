import { expect, test } from './fixtures'
import { openSettings } from './helpers/voyager'

test('ad/tracker blocking is opt-in and persists when toggled', async ({
  voyager
}) => {
  const settings = await openSettings(voyager)

  const blocking = settings.getByLabel('Block ads and trackers')
  await expect(blocking).not.toBeChecked()
  await expect
    .poll(async () => (await settings.evaluate(() => window.voyager.settings.get())).contentBlocking)
    .toBe(false)

  await blocking.check()
  await expect
    .poll(async () => (await settings.evaluate(() => window.voyager.settings.get())).contentBlocking)
    .toBe(true)

  await blocking.uncheck()
  await expect
    .poll(async () => (await settings.evaluate(() => window.voyager.settings.get())).contentBlocking)
    .toBe(false)
})
