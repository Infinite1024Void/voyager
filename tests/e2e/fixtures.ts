import { test as base } from '@playwright/test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startTestServer, type TestServer } from './helpers/server'
import { launchVoyager, type VoyagerApp } from './helpers/voyager'

interface LaunchOverrides {
  userDataDir?: string
  seed?: Record<string, unknown>
  args?: string[]
}

interface Fixtures {
  userDataDir: string
  downloadDir: string
  server: TestServer
  launchVoyager: (overrides?: LaunchOverrides) => Promise<VoyagerApp>
  voyager: VoyagerApp
}

export const test = base.extend<Fixtures>({
  userDataDir: async ({}, provide) => {
    const directory = mkdtempSync(join(tmpdir(), 'voyager-e2e-'))
    await provide(directory)
    rmSync(directory, { recursive: true, force: true })
  },

  downloadDir: async ({}, provide) => {
    const directory = mkdtempSync(join(tmpdir(), 'voyager-downloads-'))
    await provide(directory)
    rmSync(directory, { recursive: true, force: true })
  },

  server: async ({}, provide) => {
    const server = await startTestServer()
    await provide(server)
    await server.close()
  },

  launchVoyager: async ({ userDataDir, downloadDir }, provide) => {
    const launched: VoyagerApp[] = []
    const launch = async (overrides: LaunchOverrides = {}): Promise<VoyagerApp> => {
      const voyager = await launchVoyager({
        userDataDir: overrides.userDataDir ?? userDataDir,
        downloadDir,
        seed: overrides.seed,
        args: overrides.args
      })
      launched.push(voyager)
      return voyager
    }
    await provide(launch)
    for (const voyager of launched) await voyager.close()
  },

  voyager: async ({ launchVoyager }, provide) => {
    const voyager = await launchVoyager()
    await provide(voyager)
    await voyager.close()
  }
})

export { expect } from '@playwright/test'
