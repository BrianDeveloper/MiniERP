import { isCurrencyCode, type BusinessUpdateInput } from '../../shared/types/business'

export interface BusinessValidationResult {
  valid: boolean
  errors: Record<string, string>
  value?: BusinessUpdateInput
}

const LIMITS = {
  name: 120,
  rif: 40,
  address: 240,
  phone: 40
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readField(source: Record<string, unknown>, field: string): string {
  const value = source[field]
  return typeof value === 'string' ? value.trim() : ''
}

export function validateBusinessUpdate(input: unknown): BusinessValidationResult {
  if (!isRecord(input)) {
    return {
      valid: false,
      errors: { form: 'Los datos enviados no son válidos.' }
    }
  }

  const name = readField(input, 'name')
  const rif = readField(input, 'rif')
  const address = readField(input, 'address')
  const phone = readField(input, 'phone')
  const errors: Record<string, string> = {}

  if (!name) {
    errors.name = 'El nombre del negocio es obligatorio.'
  } else if (name.length > LIMITS.name) {
    errors.name = `El nombre no puede superar ${LIMITS.name} caracteres.`
  }

  if (rif.length > LIMITS.rif) {
    errors.rif = `El RIF no puede superar ${LIMITS.rif} caracteres.`
  }

  if (address.length > LIMITS.address) {
    errors.address = `La dirección no puede superar ${LIMITS.address} caracteres.`
  }

  if (phone.length > LIMITS.phone) {
    errors.phone = `El teléfono no puede superar ${LIMITS.phone} caracteres.`
  }

  if (!isCurrencyCode(input.currency)) {
    errors.currency = 'Selecciona una moneda válida.'
  }

  if (Object.keys(errors).length > 0 || !isCurrencyCode(input.currency)) {
    return { valid: false, errors }
  }

  return {
    valid: true,
    errors,
    value: {
      name,
      rif,
      currency: input.currency,
      address,
      phone
    }
  }
}
