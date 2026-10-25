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
  factoryReset: 'system:factory-reset',
  entitlementsGet: 'entitlements:get',
  entitlementsUpdate: 'entitlements:update',
  backupCreate: 'backup:create',
  backupList: 'backup:list',
  backupRestore: 'backup:restore',
  backupReveal: 'backup:reveal',
  exchangeRateGet: 'exchange-rate:get',
  exchangeRateFetchAuto: 'exchange-rate:fetch-auto',
  exchangeRateUpdateManual: 'exchange-rate:update-manual'
} as const

export interface BackupInfo {
  path: string
  name: string
  sizeBytes: number
  createdAt: string
}

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
  getEntitlements(): Promise<import('./types/entitlements').Entitlements>
  updateEntitlements(input: import('./types/entitlements').Entitlements): Promise<{ ok: boolean; error?: string }>
  createBackup(): Promise<{ ok: boolean; error?: string; backup?: BackupInfo }>
  listBackups(): Promise<{ ok: boolean; error?: string; backups?: BackupInfo[] }>
  restoreBackup(path: string): Promise<{ ok: boolean; error?: string }>
  revealBackups(): Promise<{ ok: boolean; error?: string }>
  getExchangeRate(): Promise<import('./types/exchange-rate').ExchangeRateState>
  fetchExchangeRateAuto(): Promise<import('./types/exchange-rate').ExchangeRateState>
  updateExchangeRateManual(rate: number): Promise<import('./types/exchange-rate').ExchangeRateState>
}
