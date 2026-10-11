export default function App(): React.JSX.Element {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Voyager</h1>
      <p>The Electron scaffold is running.</p>
      <p>Electron {window.voyager.versions.electron}</p>
    </div>
  )
}
