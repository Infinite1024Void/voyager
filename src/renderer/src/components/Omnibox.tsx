import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useActiveTab, useBrowserStore } from '../state/browserStore'

export function Omnibox(): React.JSX.Element {
  const activeTab = useActiveTab()
  const navigate = useBrowserStore((state) => state.navigate)
  const inputRef = useRef<HTMLInputElement>(null)

  const [value, setValue] = useState(activeTab?.url ?? '')
  const focused = useRef(false)

  // Track the active tab's URL unless the user is typing over it.
  const activeUrl = activeTab?.url ?? ''
  useEffect(() => {
    if (!focused.current) {
      setValue(activeUrl === 'about:blank' ? '' : activeUrl)
    }
  }, [activeUrl])

  const submit = (): void => {
    if (value.trim() === '') return
    focused.current = false
    navigate(value)
    inputRef.current?.blur()
  }

  return (
    <div className="no-drag flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 transition-shadow focus-within:border-accent focus-within:ring-2 focus-within:ring-ring">
      <Search className="h-3.5 w-3.5 shrink-0 text-muted" />
      <input
        ref={inputRef}
        type="text"
        spellCheck={false}
        value={value}
        placeholder="Search or enter address"
        onFocus={(event) => {
          focused.current = true
          event.currentTarget.select()
        }}
        onBlur={() => {
          focused.current = false
          setValue(activeUrl === 'about:blank' ? '' : activeUrl)
        }}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') submit()
        }}
        className="min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-muted"
      />
    </div>
  )
}