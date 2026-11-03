import { useState } from 'react'
import { Copy, Pin, Plus, RotateCw, Volume2, VolumeX, X } from 'lucide-react'
import type { TabState } from '../../../shared/types'
import { useBrowserStore } from '../state/browserStore'
import { ContextMenu, type ContextMenuItem } from './ui/ContextMenu'
import { TabItem } from './TabItem'

/**
 * Reorder `tabs` so that `drag` lands next to `over`, keeping pinned and
 * regular tabs in their own contiguous blocks (pinned always left).
 */
function reorderTabs(drag: TabState, over: TabState, tabs: TabState[]): string[] {
  const ids = tabs.map((tab) => tab.id)
  const rest = ids.filter((id) => id !== drag.id)
  const at = rest.indexOf(over.id)

  if (drag.pinned === over.pinned) {
    rest.splice(at, 0, drag.id)
    return rest
  }

  if (drag.pinned) {
    // A pinned tab may only move within the pinned block.
    const lastPinned = rest.reduce<number>(
      (last, id, index) => (tabs.find((tab) => tab.id === id)?.pinned ? index : last),
      -1
    )
    rest.splice(lastPinned + 1, 0, drag.id)
    return rest
  }

  // A regular tab dropped into the pinned block lands at its head.
  const firstRegular = rest.findIndex((id) => !tabs.find((tab) => tab.id === id)?.pinned)
  rest.splice(firstRegular === -1 ? rest.length : firstRegular, 0, drag.id)
  return rest
}

interface TabMenuState {
  x: number
  y: number
  tabId: string
}

export function TabStrip(): React.JSX.Element {
  const tabs = useBrowserStore((state) => state.tabs)
  const activeTabId = useBrowserStore((state) => state.activeTabId)
  const createTab = useBrowserStore((state) => state.createTab)
  const reorderSelected = useBrowserStore((state) => state.reorderTabs)
  const pinToggle = useBrowserStore((state) => state.pinToggle)
  const activateTab = useBrowserStore((state) => state.activateTab)

  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [menu, setMenu] = useState<TabMenuState | null>(null)

  const duplicateSelected = useBrowserStore((state) => state.duplicateTab)
  const muteSelected = useBrowserStore((state) => state.muteToggle)
  const closeSelected = useBrowserStore((state) => state.closeTab)
  const closeOthersSelected = useBrowserStore((state) => state.closeOthers)
  const closeToRightSelected = useBrowserStore((state) => state.closeToRight)
  const copyTabUrl = useBrowserStore((state) => state.copyTabUrl)
  const reload = useBrowserStore((state) => state.reload)

  const handleDrop = (targetId: string): void => {
    if (dragId && dragId !== targetId) {
      const drag = tabs.find((tab) => tab.id === dragId)
      const over = tabs.find((tab) => tab.id === targetId)
      if (drag && over) {
        reorderSelected(reorderTabs(drag, over, tabs))
      }
    }
    setDragId(null)
    setOverId(null)
  }

  const menuTab = menu ? tabs.find((tab) => tab.id === menu.tabId) : undefined
  const menuItems: ContextMenuItem[] = menuTab
    ? [
        {
          label: 'New tab',
          icon: <Plus className="h-3.5 w-3.5" />,
          onSelect: () => createTab()
        },
        { separator: true },
        {
          label: 'Reload',
          icon: <RotateCw className="h-3.5 w-3.5" />,
          onSelect: () => reload()
        },
        {
          label: 'Duplicate',
          icon: <Copy className="h-3.5 w-3.5" />,
          onSelect: () => duplicateSelected(menuTab.id)
        },
        {
          label: menuTab.pinned ? 'Unpin tab' : 'Pin tab',
          icon: <Pin className="h-3.5 w-3.5" />,
          onSelect: () => pinToggle(menuTab.id)
        },
        {
          label: menuTab.muted ? 'Unmute tab' : 'Mute tab',
          icon: menuTab.muted ? (
            <VolumeX className="h-3.5 w-3.5" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          ),
          onSelect: () => muteSelected(menuTab.id)
        },
        { separator: true },
        {
          label: 'Copy URL',
          icon: <Copy className="h-3.5 w-3.5" />,
          disabled: menuTab.url === 'about:blank' || menuTab.url === '',
          onSelect: () => copyTabUrl(menuTab.id)
        },
        { separator: true },
        {
          label: 'Close tab',
          icon: <X className="h-3.5 w-3.5" />,
          onSelect: () => closeSelected(menuTab.id)
        },
        {
          label: 'Close other tabs',
          onSelect: () => closeOthersSelected(menuTab.id)
        },
        {
          label: 'Close tabs to the right',
          onSelect: () => closeToRightSelected(menuTab.id)
        }
      ]
    : []

  return (
    <>
      <div role="tablist" className="no-drag flex h-full min-w-0 items-end gap-0.5">
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            active={tab.id === activeTabId}
            dragging={dragId === tab.id}
            dropTarget={overId === tab.id}
            onDragStart={setDragId}
            onDragOver={setOverId}
            onDrop={handleDrop}
            onDragEnd={() => {
              setDragId(null)
              setOverId(null)
            }}
            onContextMenu={(x, y) => {
              activateTab(tab.id)
              setMenu({ x, y, tabId: tab.id })
            }}
          />
        ))}
        <button
          type="button"
          aria-label="New tab"
          title="New tab"
          onClick={() => createTab()}
          className="no-drag -mb-px flex h-[26px] w-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-fg active:bg-hover/70"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />
      )}
    </>
  )
}
