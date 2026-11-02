import { expect, test } from './fixtures'

test('restores persisted tabs and active index', async ({ launchVoyager, server }) => {
  const voyager = await launchVoyager({
    seed: {
      session: {
        tabs: [
          { url: server.url('/home'), title: 'Voyager Test Home', pinned: false },
          { url: server.url('/second'), title: 'Second Page', pinned: true }
        ],
        activeIndex: 1
      }
    }
  })

  const urls = (await voyager.state()).tabs.map((tab: any) => tab.url)
  expect(urls).toContain(server.url('/home'))
  expect(urls).toContain(server.url('/second'))
  expect((await voyager.state()).tabs.length).toBe(2)
  expect((await voyager.state()).tabs.filter((tab: any) => tab.pinned).length).toBe(1)

  const active = await voyager.activeTab()
  expect(active.url).toBe(server.url('/second'))
  const activePage = await voyager.tabPage('/second')
  await expect(activePage.locator('#heading')).toHaveText('Second Page')

  await voyager.close()
})

test('falls back to a blank tab when no session is saved', async ({ launchVoyager }) => {
  const voyager = await launchVoyager({
    seed: { session: { tabs: [], activeIndex: 0 } }
  })

  const state = await voyager.state()
  expect(state.tabs.length).toBe(1)
  expect(state.tabs[0].url).toBe('about:blank')
  expect((await voyager.activeTab()).url).toBe('about:blank')

  await voyager.close()
})
