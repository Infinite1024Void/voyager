/**
 * Extract the URL a user asked Voyager to open.
 *
 * Operating systems pass links as a bare argument when the browser is invoked
 * from a terminal or when it is set as the default browser. Electron itself
 * adds flags and the app path to the same argv array, so only unambiguous web
 * URLs are accepted.
 */
const WEB_URL_PATTERN = /^(?:https?|file):\/\//i

export function findLaunchUrl(args: readonly string[]): string | null {
  for (const arg of args) {
    if (!arg || arg.startsWith('-')) continue

    const candidate = arg.trim()
    if (WEB_URL_PATTERN.test(candidate)) return candidate
  }
  return null
}
