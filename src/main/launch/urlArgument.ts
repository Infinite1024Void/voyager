/**
 * Extract the URL a user asked Voyager to open.
 *
 * Operating systems pass links as a bare argument when the browser is invoked
 * from a terminal, when it is set as the default browser, or via the
 * `voyager://open?url=...` protocol. Electron itself adds flags and the app
 * path to the same argv array, so only unambiguous web URLs are accepted.
 */
const WEB_URL_PATTERN = /^(?:https?|file):\/\//i

export function findLaunchUrl(args: readonly string[]): string | null {
  for (const arg of args) {
    if (!arg || arg.startsWith('-')) continue

    const candidate = arg.trim()
    if (WEB_URL_PATTERN.test(candidate)) return candidate

    if (candidate.toLowerCase().startsWith('voyager://')) {
      try {
        const parsed = new URL(candidate)
        const target = parsed.searchParams.get('url')
        if (target && WEB_URL_PATTERN.test(target)) return target
      } catch {
        // Ignore malformed protocol URLs and keep looking.
      }
    }
  }
  return null
}
