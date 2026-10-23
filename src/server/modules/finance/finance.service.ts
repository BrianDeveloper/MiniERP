import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import type {
  FinancialMovement,
  FinancialMovementInput,
  FinanceMovementFilters,
  FinancePeriod,
  FinanceSummary,
  SaleInput,
  SaleResult
} from '../../../shared/types/finance'
import { withTransaction } from '../../db/transaction'
import { AppError } from '../../errors'
import type { InventoryService } from '../inventory/inventory.service'
import { FinanceRepository } from './finance.repository'

const MAX_CENTS = 999_999_999_999

export class FinanceService {
  private readonly repository: FinanceRepository

  constructor(
    private readonly database: DatabaseSync,
    private readonly inventory: InventoryService
  ) {
    this.repository = new FinanceRepository(database)
  }

  listMovements(filters: FinanceMovementFilters = {}): FinancialMovement[] {
    const range = resolveRange(filters)
    return this.repository.listMovements({
      ...range,
      type: filters.type,
      search: filters.search?.trim() ?? ''
    })
  }

  getSummary(filters: FinanceMovementFilters = {}): FinanceSummary {
    return this.repository.getSummary(resolveRange(filters))
  }

  createMovement(input: FinancialMovementInput): FinancialMovement {
    const id = randomUUID()
    const createdAt = new Date().toISOString()

    this.repository.insertMovement({
      ...input,
      id,
      source: 'manual',
      inventoryMovementId: null,
      createdAt
    })

    return this.getMovement(id)
  }

  deleteMovement(id: string): void {
    const movement = this.repository.findMovement(id)
    if (!movement) {
      throw new AppError('El movimiento financiero no existe.', 404, 'movement_not_found')
    }

    if (movement.source === 'sale') {
      throw new AppError(
        'Los ingresos generados por ventas no se pueden eliminar desde Finanzas.',
        409,
        'sale_movement_locked'
      )
    }

    this.repository.deleteMovement(id)
  }

  createSale(input: SaleInput): SaleResult {
    const product = this.inventory.getProduct(input.productId)
    const totalCents = input.unitPriceCents * input.quantity

    if (!Number.isSafeInteger(totalCents) || totalCents > MAX_CENTS) {
      throw new AppError(
        'El total de la venta supera el máximo permitido.',
        400,
        'sale_total_overflow',
        { unitPriceCents: 'El total de la venta es demasiado alto.' }
      )
    }

    return withTransaction(this.database, () => {
      const stockMovement = this.inventory.registerMovement({
        productId: input.productId,
        type: 'out',
        quantity: input.quantity,
        note: input.note || 'Venta'
      })

      const id = randomUUID()
      const createdAt = new Date().toISOString()
      const concept = input.note.trim() || `Venta de ${product.name}`

      this.repository.insertMovement({
        id,
        occurredOn: input.occurredOn,
        type: 'income',
        amountCents: totalCents,
        concept,
        category: 'Ventas',
        source: 'sale',
        inventoryMovementId: stockMovement.id,
        createdAt
      })

      return {
        financialMovement: this.getMovement(id),
        stockMovement
      }
    })
  }

  private getMovement(id: string): FinancialMovement {
    const movement = this.repository.findMovement(id)
    if (!movement) {
      throw new AppError('El movimiento financiero no existe.', 404, 'movement_not_found')
    }
    return movement
  }
}

function resolveRange(filters: FinanceMovementFilters): { from?: string; to?: string } {
  if (filters.from || filters.to) {
    if (filters.from && filters.to && filters.from > filters.to) {
      throw new AppError(
        'La fecha "Desde" no puede ser posterior a "Hasta".',
        400,
        'validation_error',
        { from: 'La fecha "Desde" no puede ser posterior a "Hasta".' }
      )
    }
    return { from: filters.from, to: filters.to }
  }
  return resolvePeriod(filters.period ?? 'all')
}

function resolvePeriod(period: FinancePeriod): { from?: string; to?: string } {
  if (period === 'all') return {}

  const today = localDateString()
  if (period === 'today') return { from: today, to: today }

  const [year, month] = today.split('-')
  const lastDay = new Date(Number(year), Number(month), 0).getDate()
  return {
    from: `${year}-${month}-01`,
    to: `${year}-${month}-${String(lastDay).padStart(2, '0')}`
  }
}

function localDateString(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
