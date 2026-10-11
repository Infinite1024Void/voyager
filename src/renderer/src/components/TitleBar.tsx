import { Settings } from 'lucide-react'
import { TabStrip } from './TabStrip'
import { useBrowserStore } from '../state/browserStore'
import { SETTINGS_URL } from '../../../shared/constants'

export function TitleBar(): React.JSX.Element {
  const { createTab } = useBrowserStore()
  return (
    <header className="drag flex h-10 shrink-0 items-center border-b border-border bg-bg pl-[76px]">
      <TabStrip />
      {/* Trailing area stays draggable for the frameless window */}
      <div className="h-full flex-1" />
      <button
        type="button"
        className="no-drag mr-1 flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-fg"
        onClick={() => createTab({ url: SETTINGS_URL })}
        aria-label="Settings"
      >
        <Settings className="h-4 w-4" />
      </button>
    </header>
  )
}