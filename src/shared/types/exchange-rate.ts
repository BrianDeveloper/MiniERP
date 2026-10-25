export type ExchangeRateSource = 'bcv' | 'manual'

export interface ExchangeRateState {
  rate: number
  source: ExchangeRateSource
  lastUpdated: string | null
  isStale: boolean
  updatedToday: boolean
}

export interface ExchangeRateUpdateManualInput {
  rate: number
}
