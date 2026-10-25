export interface LicenseModules {
  inventory?: boolean
  finance?: boolean
  [key: string]: boolean | undefined
}

export interface LicenseFile {
  clientName?: string
  companyName?: string
  expirationDate?: string
  issuedAt?: string
  licenseId?: string
  modules: LicenseModules
  features?: string[]
  signature?: string
}

export interface LicenseState {
  loaded: boolean
  filePath: string | null
  data: LicenseFile | null
  validUntil: string | null
}
