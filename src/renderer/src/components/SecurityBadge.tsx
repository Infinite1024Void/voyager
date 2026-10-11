import { Globe, Lock, Search } from 'lucide-react'
import { securityLevelFor } from '../../../shared/url'
import { cn } from '../lib/cn'

interface SecurityBadgeProps {
  url: string
  editing: boolean
  onClick: () => void
}

/** Lock / globe indicator shown at the left of the omnibox when idle. */
export function SecurityBadge({ url, editing, onClick }: SecurityBadgeProps): React.JSX.Element {
  if (editing) {
    return <Search className="h-3.5 w-3.5 shrink-0 text-muted" />
  }
  const level = securityLevelFor(url)
  if (level === 'secure') {
    return (
      <button
        type="button"
        aria-label="View site information"
        onClick={onClick}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-fg transition-colors hover:bg-hover"
      >
        <Lock className="h-3.5 w-3.5" />
      </button>
    )
  }
  if (level === 'insecure') {
    return (
      <button
        type="button"
        aria-label="View site information"
        onClick={onClick}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-hover',
          url !== '' && 'text-danger' // muted grey before any page loads
        )}
      >
        <Globe className="h-3.5 w-3.5" />
      </button>
    )
  }
  return <Search className="h-3.5 w-3.5 shrink-0 text-muted" />
}