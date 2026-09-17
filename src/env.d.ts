/// <reference types="vite/client" />

import type { FilmdexApi } from '../electron/preload/index'

declare global {
  interface Window {
    filmdex: FilmdexApi
  }
}

export {}
