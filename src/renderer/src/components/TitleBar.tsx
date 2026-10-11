import { TabStrip } from './TabStrip'

export function TitleBar(): React.JSX.Element {
  return (
    <header className="drag flex h-10 shrink-0 items-center border-b border-border bg-bg pl-[76px]">
      <TabStrip />
      {/* Trailing area stays draggable for the frameless window */}
      <div className="h-full flex-1" />
    </header>
  )
}