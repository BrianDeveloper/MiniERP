export const SKU_REGEX = /^[A-Za-z0-9._-]+$/
export const RIF_REGEX = /^[VJGPCE]-\d{6,9}(?:-\d)?$|^[VEJPG]-\d{8}$/
export const PHONE_REGEX = /^[0-9+\-\s()]{7,12}$/

export const MAX_SKU_LENGTH = 20
export const MIN_PRODUCT_NAME = 3
export const MAX_PRODUCT_NAME = 100
export const MAX_CATEGORY_LENGTH = 60
export const MAX_RIF_LENGTH = 15
export const MAX_PHONE_LENGTH = 12
export const MAX_CONCEPT_LENGTH = 150
export const MAX_FINANCE_CATEGORY = 60
export const MAX_STOCK_DIGITS = 6

export function sanitizeSearchInput(value: string): string {
  if (typeof value !== 'string') return ''
  // Remove control characters and SQL-like wildcards abuse while keeping normal search
  return value
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/['";\\]/g, '')
    .replace(/--/g, ' ')
    .replace(/\/\*/g, ' ')
    .replace(/\*\//g, ' ')
    .trim()
    .slice(0, 100)
}

export function formatPhoneInput(value: string): string {
  return value.replace(/[^0-9+\-\s()]/g, '').slice(0, MAX_PHONE_LENGTH)
}

export function formatRifInput(value: string): string {
  return value.toUpperCase().replace(/[^VJGPCE0-9-]/g, '').slice(0, MAX_RIF_LENGTH)
}

export function formatSkuInput(value: string): string {
  return value.replace(/\s+/g, '').replace(/[^A-Za-z0-9._-]/g, '').slice(0, MAX_SKU_LENGTH)
}

export function isIntegerString(value: string): boolean {
  return /^-?\d+$/.test(value.trim())
}

export function isMoneyString(value: string): boolean {
  const normalized = value.trim().replace(',', '.')
  return /^\d+(\.\d{1,2})?$/.test(normalized)
}

export function parseDecimal(value: string): number | null {
  if (!isMoneyString(value)) return null
  const normalized = value.trim().replace(',', '.')
  const num = Number(normalized)
  if (!Number.isFinite(num)) return null
  return num
}

export function formatMoneyInput(value: string): string {
  // Keep digits and at most one separator
  let cleaned = value.replace(/[^0-9.,]/g, '')
  const comma = cleaned.indexOf(',')
  const dot = cleaned.indexOf('.')
  const sepIndex = Math.max(comma, dot)
  if (sepIndex >= 0) {
    const sep = comma > dot ? ',' : '.'
    const integer = cleaned.slice(0, sepIndex).replace(/[.,]/g, '')
    let fractional = cleaned.slice(sepIndex + 1).replace(/[.,]/g, '')
    if (fractional.length > 2) fractional = fractional.slice(0, 2)
    cleaned = fractional.length > 0 ? `${integer}${sep}${fractional}` : integer
  } else {
    cleaned = cleaned.replace(/[.,]/g, '')
  }
  if (cleaned === '' || cleaned === ',' || cleaned === '.') return ''
  return cleaned
}

export function formatIntegerInputValue(value: string): string {
  return value.replace(/[^0-9]/g, '').slice(0, MAX_STOCK_DIGITS)
}
