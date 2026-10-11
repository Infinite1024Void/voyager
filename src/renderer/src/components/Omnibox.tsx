import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useActiveTab } from '../state/browserStore'

export function Omnibox(): React.JSX.Element {
  const activeTab = useActiveTab()
  const [value, setValue] = useState(activeTab?.url ?? '')
  const focused = useRef(false)

  // Track the active tab's URL unless the user is typing over it.
  const activeUrl = activeTab?.url ?? ''
  useEffect(() => {
    if (!focused.current) setValue(activeUrl)
  }, [activeUrl])

  const displayValue = activeUrl === 'about:blank' ? '' : value

  return (
    <div className="no-drag flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 transition-shadow focus-within:border-accent focus-within:ring-2 focus-within:ring-ring">
      <Search className="h-3.5 w-3.5 shrink-0 text-muted" />
      <input
        type="text"
        spellCheck={false}
        value={displayValue}
        placeholder="Search or enter address"
        onFocus={(event) => {
          focused.current = true
          event.currentTarget.select()
        }}
        onBlur={() => {
          focused.current = false
          setValue(activeUrl)
        }}
        onChange={(event) => setValue(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-muted"
      />
    </div>
  )
}