import type { Session } from 'electron'
import { app } from 'electron'
import { join } from 'node:path'
import { getSettings } from '../store'
import { readJsonFile, writeJsonFile } from '../store/jsonFile'

/**
 * Built-in ad/tracker domain blocklist.
 *
 * Matching is done on the full hostname: an entry blocks the domain itself
 * and every subdomain of it (`metrics.example.com` matches `example.com`).
 * This is a curated starter set of well-known advertising and analytics
 * domains — broad enough to be useful, conservative enough to avoid breaking
 * ordinary site functionality. Site functionality domains (CDNs, fonts,
 * login providers, APIs) are deliberately not listed.
 */
export const BLOCKED_DOMAINS = [
  // Ad servers and exchanges
  'doubleclick.net',
  '2mdn.net',
  'adnxs.com',
  'adsrvr.org',
  'adhigh.net',
  'adition.com',
  'adform.net',
  'adsafeprotected.com',
  'adsymptotic.com',
  'adsymptotic.net',
  'adzerk.net',
  'adzerk.com',
  'amazon-adsystem.com',
  'casalemedia.com',
  'collective-media.com',
  'criteo.com',
  'criteo.net',
  'exelator.com',
  'exponential.com',
  'flashtalking.com',
  'googleadservices.com',
  'googlesyndication.com',
  'googletagservices.com',
  'inmobi.com',
  'mathtag.com',
  'mediamath.com',
  'millennialmedia.com',
  'mgid.com',
  'openx.net',
  'outbrain.com',
  'pubmatic.com',
  'rubiconproject.com',
  'serving-sys.com',
  'sharethrough.com',
  'sizmek.com',
  'smartadserver.com',
  'taboola.com',
  'tribalfusion.com',
  'turn.com',
  'undertone.com',
  'xaxis.com',
  'yieldmanager.com',

  // Analytics and measurement
  'analytics.amplitude.com',
  'analytics.tiktok.com',
  'analytics.twitter.com',
  'bat.bing.com',
  'chartbeat.com',
  'chartbeat.net',
  'clarity.ms',
  'crazyegg.com',
  'fullstory.com',
  'google-analytics.com',
  'googletagmanager.com',
  'heapanalytics.com',
  'hs-analytics.net',
  'hscollectedforms.net',
  'hotjar.com',
  'inspectlet.com',
  'kissmetrics.com',
  'kissmetrics.io',
  'luckyorange.com',
  'mixpanel.com',
  'mouseflow.com',
  'nr-data.net',
  'omniture.com',
  'omtrdc.net',
  'parsely.com',
  'quantcount.com',
  'quantserve.com',
  'scorecardresearch.com',
  'segment.io',
  'cdn.segment.com',
  'cdn.amplitude.com',

  // Data brokers and audience graphs
  'agkn.com',
  'bluekai.com',
  'crwdcntrl.net',
  'demdex.net',
  'id5.io',
  'krxd.net',
  'rlcdn.com',
  'tapad.com',

  // Social pixels and ad SDKs
  'ads.linkedin.com',
  'ads.twitter.com',
  'connect.facebook.net',
  'ads.yahoo.com',

  // Consent-adjacent telemetry used by ad tech
  'atwola.com'
] as const

let blockedExact = new Set<string>(BLOCKED_DOMAINS)

/** True when `hostname` is a blocked domain or a subdomain of one. */
export function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  const labels = host.split('.')
  for (let i = 0; i < labels.length; i += 1) {
    if (blockedExact.has(labels.slice(i).join('.'))) return true
  }
  return false
}

interface RemoteBlocklistCache {
  fetchedAt: number
  domains: string[]
}

const BLOCKLIST_URL = 'https://adaway.org/hosts.txt'
const BLOCKLIST_CACHE_FILE = 'blocklists-cache.json'
const REFRESH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000
const MIN_REMOTE_DOMAINS = 100

let primeStarted = false
let refreshInProgress = false

function normalizeDomain(value: string): string | null {
  const domain = value.trim().toLowerCase().replace(/\.$/, '')
  if (!domain || !domain.includes('.')) return null
  if (domain === 'localhost' || domain.endsWith('.localhost')) return null
  if (domain.startsWith('[') || domain.endsWith(']')) return null
  if (!/^[a-z0-9.-]+$/.test(domain)) return null
  return domain
}

function parseHostsBlocklist(text: string): string[] {
  const domains = new Set<string>()
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split('#')[0]?.trim()
    if (!line) continue
    const fields = line.split(/\s+/)
    if (fields.length < 2) continue
    const address = fields[0]
    if (address !== '0.0.0.0' && address !== '127.0.0.1') continue
    for (const candidate of fields.slice(1)) {
      const domain = normalizeDomain(candidate)
      if (domain) domains.add(domain)
    }
  }
  return [...domains]
}

function cachePathFor(userDataPath: string): string {
  return join(userDataPath, BLOCKLIST_CACHE_FILE)
}

function readCachedDomains(userDataPath: string): RemoteBlocklistCache {
  return readJsonFile<RemoteBlocklistCache>(cachePathFor(userDataPath), {
    fetchedAt: 0,
    domains: []
  })
}

function mergeDomainSet(domains: string[]): void {
  const next = new Set<string>(BLOCKED_DOMAINS)
  for (const domain of domains) {
    const normalized = normalizeDomain(domain)
    if (normalized) next.add(normalized)
  }
  blockedExact = next
}

async function refreshRemoteBlocklist(userDataPath: string): Promise<void> {
  if (refreshInProgress) return
  refreshInProgress = true
  try {
    const response = await fetch(BLOCKLIST_URL, {
      signal: AbortSignal.timeout(15_000)
    })
    if (!response.ok) return
    const domains = parseHostsBlocklist(await response.text())
    if (domains.length < MIN_REMOTE_DOMAINS) return
    writeJsonFile(cachePathFor(userDataPath), {
      fetchedAt: Date.now(),
      domains
    })
    mergeDomainSet(domains)
  } catch {
    // Network or storage failures fall back to the built-in curated list.
  } finally {
    refreshInProgress = false
  }
}

/**
 * Prime the content blocker from any cached list and refresh it in the
 * background when it is stale or missing. Safe to call multiple times and
 * never blocks the caller on network I/O.
 */
export function primeContentBlocking(userDataPath?: string): void {
  if (primeStarted) return
  primeStarted = true
  const directory = userDataPath ?? app.getPath('userData')
  const cached = readCachedDomains(directory)
  if (cached.domains.length > 0) mergeDomainSet(cached.domains)
  const stale = Date.now() - (cached.fetchedAt ?? 0) > REFRESH_INTERVAL_MS
  if (cached.domains.length === 0 || stale) {
    void refreshRemoteBlocklist(directory)
  }
}

const attachedSessions = new WeakSet<Session>()

/**
 * Attach the ad/tracker request filter to a session. Idempotent. Requests
 * are cancelled before they hit the network; top-level navigations are never
 * cancelled so links and typed URLs keep working. The persisted
 * `contentBlocking` preference is consulted per request, so toggling it in
 * Settings applies immediately without restarting.
 */
export function attachContentBlocking(ses: Session): void {
  if (attachedSessions.has(ses)) return
  attachedSessions.add(ses)

  ses.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (details, callback) => {
    if (getSettings('contentBlocking', false) === false) {
      callback({ cancel: false })
      return
    }
    if (details.resourceType === 'mainFrame') {
      callback({ cancel: false })
      return
    }
    let hostname: string | null
    try {
      hostname = new URL(details.url).hostname
    } catch {
      hostname = null
    }
    callback({ cancel: hostname !== null && isBlockedHost(hostname) })
  })
}
