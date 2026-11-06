import { expect, test } from './fixtures'

test('opens a URL passed as a launch argument', async ({ launchVoyager, server }) => {
  const voyager = await launchVoyager({ args: [server.url('/home')] })

  await expect.poll(async () => (await voyager.activeTab()).url).toBe(server.url('/home'))
  expect((await voyager.state()).tabs).toHaveLength(1)

  await voyager.close()
})

test('opens the launch URL alongside restored tabs', async ({ launchVoyager, server }) => {
  const voyager = await launchVoyager({
    args: [server.url('/second')],
    seed: {
      settings: { restoreSession: true },
      session: {
        tabs: [{ url: server.url('/home'), title: 'Voyager Test Home', pinned: false }],
        activeIndex: 0
      }
    }
  })

  await expect.poll(async () => (await voyager.state()).tabs).toHaveLength(2)
  await expect.poll(async () => (await voyager.activeTab()).url).toBe(server.url('/second'))

  await voyager.close()
})

test('opens a URL wrapped in the voyager:// protocol', async ({ launchVoyager, server }) => {
  const target = server.url('/home')
  const voyager = await launchVoyager({ args: [`voyager://open?url=${encodeURIComponent(target)}`] })

  await expect.poll(async () => (await voyager.activeTab()).url).toBe(target)

  await voyager.close()
})
