import { Globe, Lock, ShieldCheck, TriangleAlert } from 'lucide-react'
import { safeParseUrl, securityLevelFor } from '../../../shared/url'
import { cn } from '../lib/cn'

interface PageInfoPopoverProps {
  url: string
  title: string
}

export function PageInfoPopover({ url, title }: PageInfoPopoverProps): React.JSX.Element {
  const level = securityLevelFor(url)
  const parsed = safeParseUrl(url)

  return (
    <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-xl shadow-black/15">
      <div className="border-b border-border px-3.5 py-3">
        <p className="truncate text-[13px] font-medium text-fg">{title || 'Untitled'}</p>
        <p className="truncate text-[11.5px] text-muted">{parsed?.host ?? 'Local tab'}</p>
      </div>

      <div className="flex items-start gap-2.5 px-3.5 py-3">
        <span
          className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
            level === 'secure' && 'bg-accent/10 text-accent',
            level === 'insecure' && 'bg-danger/10 text-danger',
            level === 'neutral' && 'bg-hover text-muted'
          )}
        >
          {level === 'secure' ? (
            <ShieldCheck className="h-4 w-4" />
          ) : level === 'insecure' ? (
            <TriangleAlert className="h-4 w-4" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-fg">
            {level === 'secure' && 'Connection is secure'}
            {level === 'insecure' && 'Connection is not secure'}
            {level === 'neutral' && 'Local browser tab'}
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
            {level === 'secure' &&
              "Your information (for example, passwords or credit card numbers) is private when it is sent to this site."}
            {level === 'insecure' &&
              "Information sent over this connection could be read or changed by others. Consider using HTTPS."}
            {level === 'neutral' && 'This is a page owned by the browser itself.'}
          </p>
        </div>
      </div>

      {level === 'insecure' && (
        <p className="flex items-center gap-1.5 px-3.5 pb-3 text-[11.5px] text-danger">
          <Lock className="h-3 w-3" /> Use HTTPS to protect your data
        </p>
      )}
    </div>
  )
}