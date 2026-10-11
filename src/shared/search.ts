/** Search-engine backends: URL template + suggestion endpoint per engine. */
export const SEARCH_ENGINES = {
  duckduckgo: {
    name: 'DuckDuckGo',
    search: (query: string): string => `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
    suggest: (partial: string): string =>
      `https://duckduckgo.com/ac/?q=${encodeURIComponent(partial)}&type=list`
  },
  google: {
    name: 'Google',
    search: (query: string): string =>
      `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    suggest: (partial: string): string =>
      `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(partial)}`
  },
  brave: {
    name: 'Brave Search',
    search: (query: string): string => `https://search.brave.com/search?q=${encodeURIComponent(query)}`,
    suggest: (partial: string): string =>
      `https://search.brave.com/api/suggest?q=${encodeURIComponent(partial)}`
  }
} as const

export type SearchEngineId = keyof typeof SEARCH_ENGINES

export const DEFAULT_SEARCH_ENGINE: SearchEngineId = 'duckduckgo'

export function buildSearchUrl(engine: SearchEngineId, query: string): string {
  return SEARCH_ENGINES[engine].search(query)
}