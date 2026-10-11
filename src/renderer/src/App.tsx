import { ThemeProvider } from './components/providers/ThemeProvider'
import { TitleBar } from './components/TitleBar'
import { Toolbar } from './components/Toolbar'

export default function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <div className="flex h-full flex-col overflow-hidden">
        <TitleBar />
        <Toolbar />
      </div>
    </ThemeProvider>
  )
}