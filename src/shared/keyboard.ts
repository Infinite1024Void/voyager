/**
 * Central keyboard map shared by the main process (intercepting shortcuts on
 * tab webContents via before-input-event) and the chrome renderer (its own
 * keydown). One definition, two consumers.
 */
export type BrowserAction =
  | 'new-tab'
  | 'close-tab'
  | 'reopen-tab'
  | 'next-tab'
  | 'prev-tab'
  | 'focus-omnibox'
  | 'find-in-page'
  | 'open-tab-search'
  | 'select-tab-n'
  | 'select-tab-last'
  | 'reload'
  | 'force-reload'
  | 'stop'
  | 'back'
  | 'forward'
  | 'toggle-bookmarks-bar'
  | 'bookmark-page'
  | 'open-bookmarks-manager'
  | 'open-history'
  | 'open-downloads'
  | 'open-settings'
  | 'dev-tools'

export interface ChordInput {
  key: string
  meta: boolean
  ctrl: boolean
  shift: boolean
  alt: boolean
}

interface ShortcutDef {
  action: BrowserAction
  key: string
  /** Primary modifier: Cmd on macOS, Ctrl elsewhere. */
  meta?: boolean
  shift?: boolean
  alt?: boolean
  /** Cmd/Ctrl+1..8 select by index; the 9 is the last tab. */
  index?: number
}

function chord(
  action: BrowserAction,
  key: string,
  modifiers: Omit<ShortcutDef, 'action' | 'key' | 'index'> = {}
): ShortcutDef {
  return { action, key, ...modifiers }
}

export const SHORTCUTS: readonly ShortcutDef[] = [
  chord('new-tab', 't', { meta: true }),
  chord('close-tab', 'w', { meta: true }),
  chord('reopen-tab', 't', { meta: true, shift: true }),
  chord('next-tab', ']', { meta: true, shift: true }),
  chord('prev-tab', '[', { meta: true, shift: true }),
  chord('back', '[', { meta: true }),
  chord('forward', ']', { meta: true }),
  chord('back', 'ArrowLeft', { alt: true }),
  chord('forward', 'ArrowRight', { alt: true }),
  chord('focus-omnibox', 'l', { meta: true }),
  chord('find-in-page', 'f', { meta: true }),
  chord('open-tab-search', 'a', { meta: true, shift: true }),
  chord('reload', 'r', { meta: true }),
  chord('force-reload', 'r', { meta: true, shift: true }),
  chord('toggle-bookmarks-bar', 'b', { meta: true, shift: true }),
  chord('bookmark-page', 'd', { meta: true }),
  chord('open-bookmarks-manager', 'o', { meta: true, shift: true }),
  chord('open-history', 'y', { meta: true }),
  chord('open-downloads', 'j', { meta: true, shift: true }),
  chord('open-settings', ',', { meta: true }),
  chord('dev-tools', 'i', { meta: true, alt: true }),
  chord('stop', 'Escape'),
  { action: 'select-tab-n', key: '1', meta: true, index: 1 },
  { action: 'select-tab-n', key: '2', meta: true, index: 2 },
  { action: 'select-tab-n', key: '3', meta: true, index: 3 },
  { action: 'select-tab-n', key: '4', meta: true, index: 4 },
  { action: 'select-tab-n', key: '5', meta: true, index: 5 },
  { action: 'select-tab-n', key: '6', meta: true, index: 6 },
  { action: 'select-tab-n', key: '7', meta: true, index: 7 },
  { action: 'select-tab-n', key: '8', meta: true, index: 8 },
  { action: 'select-tab-last', key: '9', meta: true }
]

// Shift changes `key` for punctuation (Shift+] reports `}`), so fold it back.
const SHIFTED_KEYS: Record<string, string> = {
  '{': '[',
  '}': ']'
}

function normalizeKey(key: string): string {
  return (SHIFTED_KEYS[key] ?? key).toLowerCase()
}

/** Return the matched action for a chord, or null when nothing binds. */
export function matchShortcut(
  chordInput: ChordInput,
  platform: NodeJS.Platform
): { action: BrowserAction; index?: number } | null {
  const isMac = platform === 'darwin'
  const primary = isMac ? chordInput.meta : chordInput.ctrl
  // Cmd+Shift+2 on a US keyboard reports key '2'; on other layouts 'shift',
  // the key may be '#' — use code via renderer? Main listens to Input.key.
  // We also accept ctrl on mac as an alias for meta in Shift+ key chords.
  const primaryAny = primary || (isMac && chordInput.ctrl)

  for (const def of SHORTCUTS) {
    const keyMatches = def.key.toLowerCase() === normalizeKey(chordInput.key)
    const metaMatches = def.meta === undefined || primaryAny === def.meta
    const shiftMatches = (def.shift ?? false) === chordInput.shift
    const altMatches = (def.alt ?? false) === chordInput.alt
    // 'select-tab-last' binds to '9' only when no shift is held, same as any.
    if (metaMatches && shiftMatches && altMatches && keyMatches) {
      return { action: def.action, index: def.index }
    }
  }
  return null
}
