import { Search } from 'lucide-react'

export function Omnibox(): React.JSX.Element {
  return (
    <div className="no-drag flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 transition-shadow focus-within:border-accent focus-within:ring-2 focus-within:ring-ring">
      <Search className="h-3.5 w-3.5 shrink-0 text-muted" />
      <input
        type="text"
        spellCheck={false}
        placeholder="Search or enter address"
        className="min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-muted"
      />
    </div>
  )
}