import { Plus } from 'lucide-react'
import { useBrowserStore } from '../state/browserStore'
import { TabItem } from './TabItem'

export function TabStrip(): React.JSX.Element {
  const tabs = useBrowserStore((state) => state.tabs)
  const activeTabId = useBrowserStore((state) => state.activeTabId)
  const createTab = useBrowserStore((state) => state.createTab)

  return (
    <div role="tablist" className="no-drag flex h-full min-w-0 items-end gap-0.5">
      {tabs.map((tab) => (
        <TabItem key={tab.id} tab={tab} active={tab.id === activeTabId} />
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
  )
}