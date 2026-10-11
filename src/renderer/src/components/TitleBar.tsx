export function TitleBar(): React.JSX.Element {
  return (
    <header className="drag flex h-10 shrink-0 items-center border-b border-border bg-bg pl-[76px] pr-2">
      {/* Tab strip is mounted here once tabs exist */}
      <p className="px-2 text-xs text-muted">New Tab</p>
    </header>
  )
}