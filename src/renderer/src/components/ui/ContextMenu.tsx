import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface ContextMenuItem {
  label?: string
  icon?: ReactNode
  onSelect?: () => void
  disabled?: boolean
  danger?: boolean
  checked?: boolean
  /** When true, render a divider instead of an item. */
  separator?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

const MENU_PADDING = 8

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps): React.JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ left: x, top: y })

  useLayoutEffect(() => {
    const el = menuRef.current
    if (!el) return
    const { innerWidth, innerHeight } = window
    const { offsetWidth, offsetHeight } = el
    setPosition({
      left: Math.min(x, innerWidth - offsetWidth - MENU_PADDING),
      top: Math.min(y, innerHeight - offsetHeight - MENU_PADDING)
    })
  }, [x, y])

  useEffect(() => {
    const close = (): void => onClose()
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', close)
    window.addEventListener('blur', close)
    window.addEventListener('contextmenu', close)
    window.addEventListener('resize', close)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('blur', close)
      window.removeEventListener('contextmenu', close)
      window.removeEventListener('resize', close)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', close, true)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      role="menu"
      className="no-drag fixed z-50 min-w-[200px] overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl shadow-black/15"
      style={{ left: position.left, top: position.top }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {items.map((item, index) =>
        item.separator ? (
          <div key={`sep-${index}`} className="mx-2 my-1 h-px bg-border" />
        ) : (
          <button
            key={index}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              onClose()
              item.onSelect?.()
            }}
            className={cn(
              'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px]',
              'transition-colors hover:bg-hover',
              item.danger ? 'text-danger' : 'text-fg',
              item.disabled && 'pointer-events-none opacity-40'
            )}
          >
            {item.icon && <span className="flex h-4 w-4 items-center justify-center">{item.icon}</span>}
            <span className="flex-1 truncate">{item.label}</span>
            {item.checked && <span className="text-accent">✓</span>}
          </button>
        )
      )}
    </div>
  )
}