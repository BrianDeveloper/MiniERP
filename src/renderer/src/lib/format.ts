export function formatMoney(cents: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cents / 100)
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value)
}

export function formatDateTime(value: string, locale: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date)
}

export function formatDate(value: string, locale: string): string {
  const date = parseLocalDate(value)
  if (!date) return value

  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}

export function todayIsoDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function parseMoneyToCents(value: string): number | null {
  let text = value.trim().replace(/\s/g, '')
  if (!text) return null

  const lastComma = text.lastIndexOf(',')
  const lastDot = text.lastIndexOf('.')

  if (lastComma >= 0 && lastDot >= 0) {
    text =
      lastComma > lastDot
        ? text.replace(/\./g, '').replace(',', '.')
        : text.replace(/,/g, '')
  } else if (lastComma >= 0) {
    text = text.replace(',', '.')
  }

  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null

  const amount = Number(text)
  if (!Number.isFinite(amount)) return null

  return Math.round(amount * 100)
}

export function parseIntegerInput(value: string): number | null {
  const text = value.trim()
  if (!/^\d+$/.test(text)) return null

  const parsed = Number(text)
  return Number.isSafeInteger(parsed) ? parsed : null
}

function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
  return Number.isNaN(date.getTime()) ? null : date
}
