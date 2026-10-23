export const IPC_CHANNELS = {
  connection: 'app:get-connection',
  updateState: 'updates:get-state',
  updateCheck: 'updates:check',
  updateInstall: 'updates:install',
  updateStateChanged: 'updates:state-changed',
  pinHas: 'security:pin-has',
  pinSet: 'security:pin-set',
  pinVerify: 'security:pin-verify',
  pinChange: 'security:pin-change',
  pinDisable: 'security:pin-disable',
  factoryReset: 'system:factory-reset'
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
  pinHas(): Promise<boolean>
  pinSet(pin: string): Promise<{ ok: boolean; error?: string }>
  pinVerify(pin: string): Promise<{ ok: boolean }>
  pinChange(oldPin: string, newPin: string): Promise<{ ok: boolean; error?: string }>
  pinDisable(currentPin: string): Promise<{ ok: boolean; error?: string }>
  factoryReset(confirm: string): Promise<{ ok: boolean; error?: string }>
}
