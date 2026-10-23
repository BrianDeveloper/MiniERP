import type { DatabaseSync, SQLInputValue } from 'node:sqlite'
import type {
  FinancialMovement,
  FinancialMovementSource,
  FinancialMovementType,
  FinanceSummary
} from '../../../shared/types/finance'

interface MovementRow {
  id: string
  occurred_on: string
  type: FinancialMovementType
  amount_cents: number
  concept: string
  category: string
  source: FinancialMovementSource
  inventory_movement_id: string | null
  product_name: string | null
  product_sku: string | null
  quantity: number | null
  created_at: string
}

interface SummaryRow {
  income_cents: number
  expense_cents: number
  movement_count: number
  income_count: number
  expense_count: number
}

export interface FinanceMovementRecord {
  id: string
  occurredOn: string
  type: FinancialMovementType
  amountCents: number
  concept: string
  category: string
  source: FinancialMovementSource
  inventoryMovementId: string | null
  createdAt: string
}

export interface MovementFilterRecord {
  from?: string
  to?: string
  type?: FinancialMovementType
  search?: string
}

export class FinanceRepository {
  constructor(private readonly database: DatabaseSync) {}

  listMovements(filters: MovementFilterRecord): FinancialMovement[] {
    const { conditions, parameters } = buildConditions(filters)
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const rows = this.database
      .prepare(
        `SELECT f.id, f.occurred_on, f.type, f.amount_cents, f.concept, f.category,
                f.source, f.inventory_movement_id, f.created_at,
                p.name AS product_name, p.sku AS product_sku, sm.quantity
         FROM financial_movements f
         LEFT JOIN stock_movements sm ON sm.id = f.inventory_movement_id
         LEFT JOIN products p ON p.id = sm.product_id
         ${where}
         ORDER BY f.occurred_on DESC, f.created_at DESC, f.rowid DESC`
      )
      .all(...parameters) as unknown as MovementRow[]

    return rows.map(mapMovement)
  }

  findMovement(id: string): FinancialMovement | undefined {
    const row = this.database
      .prepare(
        `SELECT f.id, f.occurred_on, f.type, f.amount_cents, f.concept, f.category,
                f.source, f.inventory_movement_id, f.created_at,
                p.name AS product_name, p.sku AS product_sku, sm.quantity
         FROM financial_movements f
         LEFT JOIN stock_movements sm ON sm.id = f.inventory_movement_id
         LEFT JOIN products p ON p.id = sm.product_id
         WHERE f.id = ?`
      )
      .get(id) as unknown as MovementRow | undefined

    return row ? mapMovement(row) : undefined
  }

  insertMovement(record: FinanceMovementRecord): void {
    this.database
      .prepare(
        `INSERT INTO financial_movements (
           id, occurred_on, type, amount_cents, concept, category, source,
           inventory_movement_id, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        record.id,
        record.occurredOn,
        record.type,
        record.amountCents,
        record.concept,
        record.category,
        record.source,
        record.inventoryMovementId,
        record.createdAt
      )
  }

  deleteMovement(id: string): void {
    this.database.prepare('DELETE FROM financial_movements WHERE id = ?').run(id)
  }

  getSummary(filters: { from?: string; to?: string }): FinanceSummary {
    const conditions: string[] = []
    const parameters: SQLInputValue[] = []

    if (filters.from) {
      conditions.push('occurred_on >= ?')
      parameters.push(filters.from)
    }
    if (filters.to) {
      conditions.push('occurred_on <= ?')
      parameters.push(filters.to)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const row = this.database
      .prepare(
        `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount_cents ELSE 0 END), 0)
                  AS income_cents,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_cents ELSE 0 END), 0)
                  AS expense_cents,
                COUNT(*) AS movement_count,
                COALESCE(SUM(CASE WHEN type = 'income' THEN 1 ELSE 0 END), 0) AS income_count,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN 1 ELSE 0 END), 0) AS expense_count
         FROM financial_movements
         ${where}`
      )
      .get(...parameters) as unknown as SummaryRow

    const incomeCents = Number(row.income_cents)
    const expenseCents = Number(row.expense_cents)

    return {
      incomeCents,
      expenseCents,
      balanceCents: incomeCents - expenseCents,
      movementCount: Number(row.movement_count),
      incomeCount: Number(row.income_count),
      expenseCount: Number(row.expense_count)
    }
  }
}

function buildConditions(filters: MovementFilterRecord): {
  conditions: string[]
  parameters: SQLInputValue[]
} {
  const conditions: string[] = []
  const parameters: SQLInputValue[] = []

  if (filters.from) {
    conditions.push('f.occurred_on >= ?')
    parameters.push(filters.from)
  }
  if (filters.to) {
    conditions.push('f.occurred_on <= ?')
    parameters.push(filters.to)
  }
  if (filters.type) {
    conditions.push('f.type = ?')
    parameters.push(filters.type)
  }
  if (filters.search) {
    const pattern = toLikePattern(filters.search)
    conditions.push(
      "(f.concept LIKE ? ESCAPE '\\' OR f.category LIKE ? ESCAPE '\\' OR p.name LIKE ? ESCAPE '\\' OR p.sku LIKE ? ESCAPE '\\')"
    )
    parameters.push(pattern, pattern, pattern, pattern)
  }

  return { conditions, parameters }
}

function mapMovement(row: MovementRow): FinancialMovement {
  return {
    id: row.id,
    occurredOn: row.occurred_on,
    type: row.type,
    amountCents: Number(row.amount_cents),
    concept: row.concept,
    category: row.category,
    source: row.source,
    inventoryMovementId: row.inventory_movement_id,
    productName: row.product_name,
    productSku: row.product_sku,
    quantity: row.quantity === null ? null : Number(row.quantity),
    createdAt: row.created_at
  }
}

function toLikePattern(term: string): string {
  const escaped = term.replace(/[\\%_]/g, (character) => `\\${character}`)
  return `%${escaped}%`
}
