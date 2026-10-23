/// <reference types="vite/client" />

import type { MinierpBridge } from '../../shared/ipc'

declare global {
  interface Window {
    minierp?: MinierpBridge
  }
}

export {}
