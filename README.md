# Voyager

A modern, pretty web browser built with Electron.

> [!WARNING]
> This project is mostly vibe-coded with OpenCode and is just an experiment. Most of the code is written by AI *and reviewed by a human*, treat it with caution.

## Stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Framing    | Electron 44, `BaseWindow` + `WebContentsView` per tab   |
| Chrome UI  | React 19, TypeScript, Tailwind CSS, Zustand             |
| Build tool | electron-vite 5 (Vite 7)                                |
| Quality    | ESLint, Prettier, husky + commitlint hooks        |

## Getting started

```bash
npm install
npm run dev
```

After the first `npm install`, if the Electron binary was not downloaded (npm 12
blocks install scripts by default), fetch it manually:

```bash
node node_modules/electron/install.js
```

## Scripts

| Command             | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Run in development with HMR               |
| `npm run build`     | Build main, preload, and renderer         |
| `npm run preview`   | Run the production build                  |
| `npm run typecheck` | Type-check the whole codebase             |
| `npm run lint`      | ESLint                                    |
| `npm run format`    | Format with Prettier                      |

## Layout

```
src/
  main/        Electron main process (window, tabs, sessions, stores, menus)
  preload/     contextBridge API exposed to the chrome UI
  renderer/    React app for the browser chrome (tab strip, toolbar, pages)
  shared/      Types and IPC channel contract shared across processes
```

### Process model

- The **main** process owns a `BaseWindow` and one `WebContentsView` per tab.
  It is the only process that touches Node.js APIs or the filesystem.
- The **chrome renderer** renders the browser UI in a dedicated
  `WebContentsView` pinned to the top of the window. It communicates with the
  main process exclusively through the typed `window.voyager` bridge.
- **Tab content** runs in fully sandboxed `webContents` (`contextIsolation`,
  no Node integration) and never receives the bridge API.

## Browser security

- Content views are sandboxed; `nodeIntegration` and `process` are never exposed
  to web pages.
- `setWindowOpenHandler` and a permission handler route every privileged action
  (new windows, notifications, geolocation, ...) through the main process.
- A narrow IPCs can be audited in `src/shared/ipc-channels.ts`.

## Contributing

- Conventional Commits are enforced via husky + commitlint.
- One commit per logical change; each commit must pass `typecheck` and `lint`
  (run automatically on commit).
- Commit scopes mirror the module touched (e.g. `feat(tabs): ...`,
  `fix(omnibox): ...`).
