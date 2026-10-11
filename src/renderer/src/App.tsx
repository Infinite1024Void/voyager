import { TitleBar } from './components/TitleBar'
import { Toolbar } from './components/Toolbar'

export default function App(): React.JSX.Element {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TitleBar />
      <Toolbar />
    </div>
  )
}