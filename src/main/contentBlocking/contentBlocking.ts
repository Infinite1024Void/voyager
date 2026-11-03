import type { Session } from 'electron'
import { getSettings } from '../store'

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

const blockedExact = new Set<string>(BLOCKED_DOMAINS)

/** True when `hostname` is a blocked domain or a subdomain of one. */
export function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  const labels = host.split('.')
  for (let i = 0; i < labels.length; i += 1) {
    if (blockedExact.has(labels.slice(i).join('.'))) return true
  }
  return false
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
    if (getSettings('contentBlocking', true) === false) {
      callback({ cancel: false })
      return
    }
    if (details.resourceType === 'mainFrame') {
      callback({ cancel: false })
      return
    }
    let hostname: string | null = null
    try {
      hostname = new URL(details.url).hostname
    } catch {
      hostname = null
    }
    callback({ cancel: hostname !== null && isBlockedHost(hostname) })
  })
}
