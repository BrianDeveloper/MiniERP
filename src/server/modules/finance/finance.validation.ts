import {
  FINANCIAL_MOVEMENT_TYPES,
  FINANCE_PERIODS,
  type FinancialMovementInput,
  type FinancialMovementType,
  type FinancePeriod,
  type SaleInput
} from '../../../shared/types/finance'
import {
  asRecord,
  readEnum,
  readInteger,
  readIsoDate,
  readText,
  throwIfInvalid
} from '../../validation/input'

const MAX_CENTS = 999_999_999_999
const MAX_UNITS = 1_000_000_000

export function parseFinancialMovement(body: unknown): FinancialMovementInput {
  const raw = asRecord(body)
  const errors: Record<string, string> = {}

  const occurredOn = readIsoDate(raw, 'occurredOn', 'La fecha', errors)
  const type = readEnum(
    raw,
    'type',
    'El tipo de movimiento',
    errors,
    FINANCIAL_MOVEMENT_TYPES
  )
  const amountCents = readInteger(raw, 'amountCents', 'El monto', errors, MAX_CENTS, 1)
  const concept = readText(raw, 'concept', 'El concepto', errors, {
    required: true,
    max: 160
  })
  const category = readText(raw, 'category', 'La categoría', errors, { max: 60 })

  throwIfInvalid(errors)

  return {
    occurredOn: occurredOn ?? '',
    type: type ?? 'income',
    amountCents: amountCents ?? 1,
    concept: concept ?? '',
    category: category ?? ''
  }
}

export function parseSale(body: unknown): SaleInput {
  const raw = asRecord(body)
  const errors: Record<string, string> = {}

  const occurredOn = readIsoDate(raw, 'occurredOn', 'La fecha', errors)
  const productId = readText(raw, 'productId', 'El producto', errors, {
    required: true,
    max: 64
  })
  const quantity = readInteger(raw, 'quantity', 'La cantidad', errors, MAX_UNITS, 1)
  const unitPriceCents = readInteger(
    raw,
    'unitPriceCents',
    'El precio unitario',
    errors,
    MAX_CENTS,
    1
  )
  const note = readText(raw, 'note', 'La nota', errors, { max: 200 })

  throwIfInvalid(errors)

  return {
    occurredOn: occurredOn ?? '',
    productId: productId ?? '',
    quantity: quantity ?? 1,
    unitPriceCents: unitPriceCents ?? 1,
    note: note ?? ''
  }
}

export function parsePeriodFilter(value: unknown): FinancePeriod {
  return typeof value === 'string' && FINANCE_PERIODS.includes(value as FinancePeriod)
    ? (value as FinancePeriod)
    : 'all'
}

export function parseTypeFilter(value: unknown): FinancialMovementType | undefined {
  return typeof value === 'string' &&
    FINANCIAL_MOVEMENT_TYPES.includes(value as FinancialMovementType)
    ? (value as FinancialMovementType)
    : undefined
}
