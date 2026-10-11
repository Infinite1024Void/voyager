/** Heuristics for whether omnibox input is a URL or a search query. */

// A lone hostname like `example.com` or `localhost:8080`.
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i
const LOCALHOST = /^localhost(:\d+)?$/i
const IP_ADDRESS = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/
const DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i

export function hasScheme(input: string): boolean {
  return HAS_SCHEME.test(input.trim())
}

export function isLikelyUrl(input: string): boolean {
  const trimmed = input.trim()
  if (trimmed === '' || /\s/.test(trimmed)) return false
  if (hasScheme(trimmed)) return true
  const host = trimmed.split(/[/:?#]/)[0]
  return LOCALHOST.test(trimmed) || IP_ADDRESS.test(host) || DOMAIN.test(host)
}

/** Turn omnibox text into a navigable URL, searching when it isn't one. */
export function resolveInput(input: string, searchUrlFor: (query: string) => string): string {
  const trimmed = input.trim()
  if (isLikelyUrl(trimmed)) {
    return hasScheme(trimmed) ? trimmed : `https://${trimmed}`
  }
  return searchUrlFor(trimmed)
}

export function safeParseUrl(raw: string): URL | null {
  try {
    return new URL(raw)
  } catch {
    return null
  }
}

export type SecurityLevel = 'secure' | 'insecure' | 'neutral'

/** Coarse connection security for a URL, for the omnibox indicator. */
export function securityLevelFor(url: string): SecurityLevel {
  const parsed = safeParseUrl(url)
  if (!parsed) return 'neutral'
  if (parsed.protocol === 'https:') return 'secure'
  if (parsed.protocol === 'http:') return 'insecure'
  return 'neutral'
}