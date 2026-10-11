/// <reference types="vite/client" />

import type { VoyagerApi } from '../../preload'

declare global {
  interface Window {
    voyager: VoyagerApi
  }
}
