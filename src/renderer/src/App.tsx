import { useEffect, useState } from 'react'
import type { AppVersionInfo } from '../../shared/types'

export default function App(): React.JSX.Element {
  const [info, setInfo] = useState<AppVersionInfo | null>(null)

  useEffect(() => {
    void window.voyager.appInfo().then(setInfo)
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Voyager</h1>
      <p>The Electron scaffold is running.</p>
      {info ? (
        <dl>
          <dt>App</dt>
          <dd>{info.app}</dd>
          <dt>Electron</dt>
          <dd>{info.electron}</dd>
          <dt>Chromium</dt>
          <dd>{info.chrome}</dd>
          <dt>Node</dt>
          <dd>{info.node}</dd>
        </dl>
      ) : (
        <p>Loading versions…</p>
      )}
    </div>
  )
}