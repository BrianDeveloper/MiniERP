export const IPC_CHANNELS = {
  connection: 'app:get-connection',
  updateState: 'updates:get-state',
  updateCheck: 'updates:check',
  updateInstall: 'updates:install',
  updateStateChanged: 'updates:state-changed'
} as const

export interface ApiConnection {
  baseUrl: string
  token: string
}

export type UpdatePhase =
  | 'disabled'
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'not-available'
  | 'error'

export interface UpdateState {
  phase: UpdatePhase
  currentVersion: string
  availableVersion: string | null
  progress: number | null
  message: string
}

export interface MinierpBridge {
  getConnection(): Promise<ApiConnection>
  getUpdateState(): Promise<UpdateState>
  checkForUpdates(): Promise<UpdateState>
  installUpdate(): Promise<void>
  onUpdateState(listener: (state: UpdateState) => void): () => void
}
