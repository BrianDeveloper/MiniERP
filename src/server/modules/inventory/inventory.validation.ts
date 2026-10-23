import {
  STOCK_MOVEMENT_TYPES,
  type ProductCreateInput,
  type ProductUpdateInput,
  type StockMovementInput
} from '../../../shared/types/inventory'
import {
  asRecord,
  readEnum,
  readInteger,
  readText,
  throwIfInvalid
} from '../../validation/input'

const MAX_CENTS = 999_999_999_999
const MAX_UNITS = 1_000_000_000

export function parseProductCreate(body: unknown): ProductCreateInput {
  const raw = asRecord(body)
  const errors: Record<string, string> = {}

  const sku = readText(raw, 'sku', 'El SKU', errors, { required: true, max: 40 })
  const name = readText(raw, 'name', 'El nombre', errors, { required: true, max: 120 })
  const category = readText(raw, 'category', 'La categoría', errors, { max: 60 })
  const costPriceCents = readInteger(raw, 'costPriceCents', 'El costo', errors, MAX_CENTS)
  const salePriceCents = readInteger(raw, 'salePriceCents', 'El precio de venta', errors, MAX_CENTS)
  const stockMinimum = readInteger(raw, 'stockMinimum', 'El stock mínimo', errors, MAX_UNITS)
  const initialStock =
    raw.initialStock === undefined || raw.initialStock === null
      ? 0
      : readInteger(raw, 'initialStock', 'El stock inicial', errors, MAX_UNITS)

  throwIfInvalid(errors)

  return {
    sku: sku ?? '',
    name: name ?? '',
    category: category ?? '',
    costPriceCents: costPriceCents ?? 0,
    salePriceCents: salePriceCents ?? 0,
    stockMinimum: stockMinimum ?? 0,
    initialStock: initialStock ?? 0
  }
}

export function parseProductUpdate(body: unknown): ProductUpdateInput {
  const raw = asRecord(body)
  const errors: Record<string, string> = {}

  const sku = readText(raw, 'sku', 'El SKU', errors, { required: true, max: 40 })
  const name = readText(raw, 'name', 'El nombre', errors, { required: true, max: 120 })
  const category = readText(raw, 'category', 'La categoría', errors, { max: 60 })
  const costPriceCents = readInteger(raw, 'costPriceCents', 'El costo', errors, MAX_CENTS)
  const salePriceCents = readInteger(raw, 'salePriceCents', 'El precio de venta', errors, MAX_CENTS)
  const stockMinimum = readInteger(raw, 'stockMinimum', 'El stock mínimo', errors, MAX_UNITS)

  throwIfInvalid(errors)

  return {
    sku: sku ?? '',
    name: name ?? '',
    category: category ?? '',
    costPriceCents: costPriceCents ?? 0,
    salePriceCents: salePriceCents ?? 0,
    stockMinimum: stockMinimum ?? 0
  }
}

export function parseStockMovement(body: unknown): StockMovementInput {
  const raw = asRecord(body)
  const errors: Record<string, string> = {}

  const productId = readText(raw, 'productId', 'El producto', errors, {
    required: true,
    max: 64
  })
  const type = readEnum(raw, 'type', 'El tipo de movimiento', errors, STOCK_MOVEMENT_TYPES)
  const quantity = readInteger(raw, 'quantity', 'La cantidad', errors, MAX_UNITS, 1)
  const note = readText(raw, 'note', 'La nota', errors, { max: 200 })

  throwIfInvalid(errors)

  return {
    productId: productId ?? '',
    type: type ?? 'in',
    quantity: quantity ?? 1,
    note: note ?? ''
  }
}
