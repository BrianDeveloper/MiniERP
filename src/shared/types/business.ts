export const CURRENCIES = [
  { code: 'VES', label: 'Bolívar venezolano', symbol: 'Bs.', locale: 'es-VE' },
  { code: 'USD', label: 'Dólar estadounidense', symbol: '$', locale: 'en-US' },
  { code: 'COP', label: 'Peso colombiano', symbol: '$', locale: 'es-CO' },
  { code: 'EUR', label: 'Euro', symbol: '€', locale: 'es-ES' },
  { code: 'MXN', label: 'Peso mexicano', symbol: '$', locale: 'es-MX' },
  { code: 'ARS', label: 'Peso argentino', symbol: '$', locale: 'es-AR' }
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]['code']

export interface BusinessProfile {
  schemaVersion: 1
  name: string
  rif: string
  currency: CurrencyCode
  locale: string
  address: string
  phone: string
  updatedAt: string | null
}

export interface BusinessUpdateInput {
  name: string
  rif: string
  currency: CurrencyCode
  address: string
  phone: string
}

export const DEFAULT_CURRENCY: CurrencyCode = 'VES'

export const DEFAULT_BUSINESS: BusinessProfile = {
  schemaVersion: 1,
  name: 'Mi Comercio',
  rif: '',
  currency: DEFAULT_CURRENCY,
  locale: getCurrency(DEFAULT_CURRENCY).locale,
  address: '',
  phone: '',
  updatedAt: null
}

export function getCurrency(code: string): (typeof CURRENCIES)[number] {
  return CURRENCIES.find((currency) => currency.code === code) ?? CURRENCIES[0]
}

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && CURRENCIES.some((currency) => currency.code === value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeBusiness(value: unknown): BusinessProfile {
  const raw = isRecord(value) ? value : {}
  const currency = isCurrencyCode(raw.currency) ? raw.currency : DEFAULT_CURRENCY
  const currencyMeta = getCurrency(currency)

  return {
    schemaVersion: 1,
    name: asText(raw.name) || DEFAULT_BUSINESS.name,
    rif: asText(raw.rif),
    currency,
    locale: currencyMeta.locale,
    address: asText(raw.address),
    phone: asText(raw.phone),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null
  }
}
