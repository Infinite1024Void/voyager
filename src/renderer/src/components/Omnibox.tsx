import { useEffect, useRef, useState } from 'react'
import { Globe, Search } from 'lucide-react'
import { cn } from '../lib/cn'
import { DEFAULT_SEARCH_ENGINE, SEARCH_ENGINES, buildSearchUrl, parseSuggestions } from '../../../shared/search'
import { useActiveTab, useBrowserStore } from '../state/browserStore'
import { PageInfoPopover } from './PageInfoPopover'
import { SecurityBadge } from './SecurityBadge'

function useSuggestions(query: string, active: boolean): string[] {
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (!active || query.trim().length < 2) {
      setSuggestions([])
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      fetch(SEARCH_ENGINES[DEFAULT_SEARCH_ENGINE].suggest(query.trim()), {
        signal: controller.signal
      })
        .then((response) => response.text())
        .then(parseSuggestions)
        .then(setSuggestions)
        .catch(() => {
          /* suggestions are best-effort */
        })
    }, 140)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query, active])

  return suggestions
}

export function Omnibox(): React.JSX.Element {
  const activeTab = useActiveTab()
  const navigate = useBrowserStore((state) => state.navigate)
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const [value, setValue] = useState(activeTab?.url ?? '')
  const [focused, setFocused] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [pageInfoOpen, setPageInfoOpen] = useState(false)

  const activeUrl = activeTab?.url ?? ''
  const activeTitle = activeTab?.title ?? ''
  useEffect(() => {
    if (!focused) setValue(activeUrl === 'about:blank' ? '' : activeUrl)
  }, [activeUrl, focused])

  const suggestions = useSuggestions(value, focused && value.trim().length > 0)
  const showDropdown = focused && value.trim() !== '' && !pageInfoOpen
  const rowCount = suggestions.length + 1 // index 0 is "search for ..."

  const searchFor = (query: string): void => {
    navigate(buildSearchUrl(DEFAULT_SEARCH_ENGINE, query))
    setFocused(false)
    inputRef.current?.blur()
  }
  const submit = (): void => {
    if (value.trim() === '') return
    navigate(value)
    setFocused(false)
    inputRef.current?.blur()
  }
  const runRow = (index: number): void => {
    if (index === 0) submit()
    else searchFor(suggestions[index - 1])
  }

  return (
    <div ref={rootRef} className="no-drag relative min-w-0 flex-1">
      <div className="flex h-8 items-center gap-2 rounded-lg border border-border bg-surface px-3 transition-shadow focus-within:border-accent focus-within:ring-2 focus-within:ring-ring">
        <SecurityBadge
          url={activeUrl}
          editing={focused}
          onClick={() => setPageInfoOpen((open) => !open)}
        />
        <input
          ref={inputRef}
          id="omnibox-input"
          type="text"
          spellCheck={false}
          value={value}
          placeholder="Search or enter address"
          onFocus={(event) => {
            setFocused(true)
            setPageInfoOpen(false)
            event.currentTarget.select()
          }}
          onBlur={(event) => {
            if (rootRef.current?.contains(event.relatedTarget as Node)) return
            setFocused(false)
            setValue(activeUrl === 'about:blank' ? '' : activeUrl)
          }}
          onChange={(event) => {
            setValue(event.target.value)
            setHighlight(0)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setHighlight((index) => Math.min(index + 1, rowCount - 1))
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setHighlight((index) => Math.max(index - 1, 0))
            } else if (event.key === 'Enter') {
              event.preventDefault()
              runRow(highlight)
            } else if (event.key === 'Escape') {
              setFocused(false)
              inputRef.current?.blur()
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-muted"
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl shadow-black/15">
          <SuggestionRow
            active={highlight === 0}
            onActivate={() => setHighlight(0)}
            onSelect={() => runRow(0)}
            icon={<Search className="h-3.5 w-3.5" />}
            title={value.trim()}
            detail={`Search ${SEARCH_ENGINES[DEFAULT_SEARCH_ENGINE].name}`}
          />
          {suggestions.map((suggestion, index) => (
            <SuggestionRow
              key={suggestion}
              active={highlight === index + 1}
              onActivate={() => setHighlight(index + 1)}
              onSelect={() => runRow(index + 1)}
              icon={<Globe className="h-3.5 w-3.5" />}
              title={suggestion}
            />
          ))}
        </div>
      )}

      {pageInfoOpen && <PageInfoPopover url={activeUrl} title={activeTitle} />}
    </div>
  )
}

interface SuggestionRowProps {
  active: boolean
  onActivate: () => void
  onSelect: () => void
  icon: React.ReactNode
  title: string
  detail?: string
}

function SuggestionRow({
  active,
  onActivate,
  onSelect,
  icon,
  title,
  detail
}: SuggestionRowProps): React.JSX.Element {
  return (
    <button
      type="button"
      onMouseEnter={onActivate}
      onMouseDown={(event) => {
        event.preventDefault()
        onSelect()
      }}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors',
        active ? 'bg-hover' : 'bg-transparent'
      )}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-muted">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-fg">{title}</span>
      {detail && <span className="shrink-0 text-[11.5px] text-muted">{detail}</span>}
    </button>
  )
}