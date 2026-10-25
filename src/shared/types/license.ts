export interface LicenseModules {
  inventory: boolean
  finances: boolean
  finance?: boolean
  [key: string]: boolean | undefined
}

export interface LicenseFile {
  clientName: string
  rif: string
  expiresAt: string
  modules: LicenseModules
}

export interface LicenseState {
  loaded: boolean
  filePath: string | null
  data: LicenseFile | null
  validUntil: string | null
  error?: string | null
}
