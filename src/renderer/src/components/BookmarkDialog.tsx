import { useEffect, useState } from 'react'
import { useOverlaySignal } from '../lib/overlay'

interface BookmarkDialogProps {
  title: string
  initialTitle?: string
  initialUrl?: string
  showUrl?: boolean
  submitLabel: string
  onSubmit: (title: string, url: string) => void
  onClose: () => void
}

/** Small modal used for creating folders and editing bookmark titles/URLs. */
export function BookmarkDialog({
  title,
  initialTitle = '',
  initialUrl = '',
  showUrl = false,
  submitLabel,
  onSubmit,
  onClose
}: BookmarkDialogProps): React.JSX.Element {
  const [name, setName] = useState(initialTitle)
  const [url, setUrl] = useState(initialUrl)

  useOverlaySignal(true)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30"
      onMouseDown={(event) => {
        event.stopPropagation()
        onClose()
      }}
    >
      <form
        aria-label={title}
        className="w-[420px] rounded-xl border border-border bg-surface p-5 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(name.trim() || initialTitle, url.trim() || initialUrl)
        }}
      >
        <h2 className="mb-4 text-[15px] font-semibold text-fg">{title}</h2>
        <label className="mb-1 block text-[12px] text-muted" htmlFor="bookmark-dialog-name">
          Name
        </label>
        <input
          id="bookmark-dialog-name"
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mb-3 w-full rounded-md border border-border bg-bg px-3 py-2 text-[13px] text-fg outline-none focus:border-accent"
        />
        {showUrl && (
          <>
            <label className="mb-1 block text-[12px] text-muted" htmlFor="bookmark-dialog-url">
              URL
            </label>
            <input
              id="bookmark-dialog-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="mb-3 w-full rounded-md border border-border bg-bg px-3 py-2 text-[13px] text-fg outline-none focus:border-accent"
            />
          </>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-[13px] text-fg hover:bg-hover"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-accent px-3 py-1.5 text-[13px] text-accent-foreground"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
