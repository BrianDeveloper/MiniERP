import { AppError } from '../errors'

export type RawInput = Record<string, unknown>

export function asRecord(value: unknown): RawInput {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as RawInput)
    : {}
}

export function readText(
  raw: RawInput,
  field: string,
  label: string,
  errors: Record<string, string>,
  options: { required?: boolean; max: number }
): string | undefined {
  const value = raw[field]

  if (value === undefined || value === null) {
    if (options.required) errors[field] = `${label} es obligatorio.`
    return undefined
  }

  if (typeof value !== 'string') {
    errors[field] = `${label} no es válido.`
    return undefined
  }

  const text = value.trim()
  if (options.required && text.length === 0) {
    errors[field] = `${label} es obligatorio.`
    return undefined
  }

  if (text.length > options.max) {
    errors[field] = `${label} no puede superar ${options.max} caracteres.`
    return undefined
  }

  return text
}

export function readInteger(
  raw: RawInput,
  field: string,
  label: string,
  errors: Record<string, string>,
  max: number,
  min = 0
): number | undefined {
  const value = raw[field]

  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    errors[field] = `${label} debe ser un número entero entre ${min} y ${max}.`
    return undefined
  }

  return value
}

export function readIsoDate(
  raw: RawInput,
  field: string,
  label: string,
  errors: Record<string, string>
): string | undefined {
  const text = readText(raw, field, label, errors, { required: true, max: 10 })
  if (text === undefined) return undefined

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (!match) {
    errors[field] = `${label} no es una fecha válida.`
    return undefined
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    errors[field] = `${label} no es una fecha válida.`
    return undefined
  }

  return text
}

export function readEnum<T extends string>(
  raw: RawInput,
  field: string,
  label: string,
  errors: Record<string, string>,
  values: readonly T[]
): T | undefined {
  const value = raw[field]
  if (typeof value === 'string' && values.includes(value as T)) {
    return value as T
  }

  errors[field] = `${label} no es válido.`
  return undefined
}

export function throwIfInvalid(errors: Record<string, string>): void {
  if (Object.keys(errors).length > 0) {
    throw new AppError(
      'Revisa los datos ingresados e inténtalo de nuevo.',
      400,
      'validation_error',
      errors
    )
  }
}
