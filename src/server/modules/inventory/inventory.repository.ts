import type { DatabaseSync, SQLInputValue } from 'node:sqlite'
import type {
  InventorySummary,
  InventoryValuation,
  MovementFilters,
  Product,
  ProductFilters,
  ProductCreateInput,
  ProductUpdateInput,
  StockMovement,
  StockMovementInput,
  StockMovementType
} from '../../../shared/types/inventory'

interface ProductRow {
  id: string
  sku: string
  name: string
  category: string
  cost_price_cents: number
  sale_price_cents: number
  stock_current: number
  stock_minimum: number
  created_at: string
  updated_at: string
}

interface MovementRow {
  id: string
  product_id: string
  product_name: string
  product_sku: string
  type: StockMovementType
  quantity: number
  stock_before: number
  stock_after: number
  note: string
  created_at: string
}

interface TotalsRow {
  total_units: number
  cost_value_cents: number
  retail_value_cents: number
}

export interface ProductRecord extends ProductCreateInput {
  id: string
  stockCurrent: number
  createdAt: string
  updatedAt: string
}

export interface MovementRecord extends StockMovementInput {
  id: string
  stockBefore: number
  stockAfter: number
  createdAt: string
}

export class InventoryRepository {
  constructor(private readonly database: DatabaseSync) {}

  listProducts(filters: ProductFilters): Product[] {
    const conditions = ['archived_at IS NULL']
    const parameters: SQLInputValue[] = []

    if (filters.search) {
      const pattern = toLikePattern(filters.search)
      conditions.push(
        "(name LIKE ? ESCAPE '\\' OR sku LIKE ? ESCAPE '\\' OR category LIKE ? ESCAPE '\\')"
      )
      parameters.push(pattern, pattern, pattern)
    }

    if (filters.lowStockOnly) {
      conditions.push('stock_current <= stock_minimum')
    }

    const rows = this.database
      .prepare(
        `SELECT id, sku, name, category, cost_price_cents, sale_price_cents,
                stock_current, stock_minimum, created_at, updated_at
         FROM products
         WHERE ${conditions.join(' AND ')}
         ORDER BY name COLLATE NOCASE ASC`
      )
      .all(...parameters) as unknown as ProductRow[]

    return rows.map(mapProduct)
  }

  findProduct(id: string): Product | undefined {
    const row = this.database
      .prepare(
        `SELECT id, sku, name, category, cost_price_cents, sale_price_cents,
                stock_current, stock_minimum, created_at, updated_at
         FROM products
         WHERE id = ? AND archived_at IS NULL`
      )
      .get(id) as unknown as ProductRow | undefined

    return row ? mapProduct(row) : undefined
  }

  findActiveBySku(sku: string, excludeId?: string): Product | undefined {
    const row = (
      excludeId
        ? this.database
            .prepare(
              `SELECT id, sku, name, category, cost_price_cents, sale_price_cents,
                      stock_current, stock_minimum, created_at, updated_at
               FROM products
               WHERE sku = ? COLLATE NOCASE AND archived_at IS NULL AND id <> ?`
            )
            .get(sku, excludeId)
        : this.database
            .prepare(
              `SELECT id, sku, name, category, cost_price_cents, sale_price_cents,
                      stock_current, stock_minimum, created_at, updated_at
               FROM products
               WHERE sku = ? COLLATE NOCASE AND archived_at IS NULL`
            )
            .get(sku)
    ) as unknown as ProductRow | undefined

    return row ? mapProduct(row) : undefined
  }

  insertProduct(record: ProductRecord): void {
    this.database
      .prepare(
        `INSERT INTO products (
           id, sku, name, category, cost_price_cents, sale_price_cents,
           stock_current, stock_minimum, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        record.id,
        record.sku,
        record.name,
        record.category,
        record.costPriceCents,
        record.salePriceCents,
        record.stockCurrent,
        record.stockMinimum,
        record.createdAt,
        record.updatedAt
      )
  }

  updateProduct(id: string, input: ProductUpdateInput, updatedAt: string): void {
    this.database
      .prepare(
        `UPDATE products
         SET sku = ?, name = ?, category = ?, cost_price_cents = ?, sale_price_cents = ?,
             stock_minimum = ?, updated_at = ?
         WHERE id = ? AND archived_at IS NULL`
      )
      .run(
        input.sku,
        input.name,
        input.category,
        input.costPriceCents,
        input.salePriceCents,
        input.stockMinimum,
        updatedAt,
        id
      )
  }

  archiveProduct(id: string, archivedAt: string): void {
    this.database
      .prepare(
        `UPDATE products
         SET archived_at = ?, updated_at = ?
         WHERE id = ? AND archived_at IS NULL`
      )
      .run(archivedAt, archivedAt, id)
  }

  updateStock(id: string, stockCurrent: number, updatedAt: string): void {
    this.database
      .prepare('UPDATE products SET stock_current = ?, updated_at = ? WHERE id = ?')
      .run(stockCurrent, updatedAt, id)
  }

  insertMovement(record: MovementRecord): void {
    this.database
      .prepare(
        `INSERT INTO stock_movements (
           id, product_id, type, quantity, stock_before, stock_after, note, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        record.id,
        record.productId,
        record.type,
        record.quantity,
        record.stockBefore,
        record.stockAfter,
        record.note,
        record.createdAt
      )
  }

  listMovements(filters: MovementFilters): StockMovement[] {
    const limit = filters.limit ?? 60
    const rows = (
      filters.productId
        ? this.database
            .prepare(
              `SELECT m.id, m.product_id, p.name AS product_name, p.sku AS product_sku,
                      m.type, m.quantity, m.stock_before, m.stock_after, m.note, m.created_at
               FROM stock_movements m
               JOIN products p ON p.id = m.product_id
               WHERE m.product_id = ?
               ORDER BY m.created_at DESC, m.rowid DESC
               LIMIT ?`
            )
            .all(filters.productId, limit)
        : this.database
            .prepare(
              `SELECT m.id, m.product_id, p.name AS product_name, p.sku AS product_sku,
                      m.type, m.quantity, m.stock_before, m.stock_after, m.note, m.created_at
               FROM stock_movements m
               JOIN products p ON p.id = m.product_id
               ORDER BY m.created_at DESC, m.rowid DESC
               LIMIT ?`
            )
            .all(limit)
    ) as unknown as MovementRow[]

    return rows.map(mapMovement)
  }

  getSummary(): InventorySummary {
    const row = this.database
      .prepare(
        `SELECT COUNT(*) AS product_count,
                COALESCE(SUM(stock_current), 0) AS total_units,
                COALESCE(SUM(CASE WHEN stock_current <= stock_minimum THEN 1 ELSE 0 END), 0)
                  AS low_stock_count,
                COALESCE(SUM(stock_current * cost_price_cents), 0) AS cost_value_cents,
                COALESCE(SUM(stock_current * sale_price_cents), 0) AS retail_value_cents
         FROM products
         WHERE archived_at IS NULL`
      )
      .get() as unknown as {
      product_count: number
      total_units: number
      low_stock_count: number
      cost_value_cents: number
      retail_value_cents: number
    }

    return {
      productCount: Number(row.product_count),
      totalUnits: Number(row.total_units),
      lowStockCount: Number(row.low_stock_count),
      costValueCents: Number(row.cost_value_cents),
      retailValueCents: Number(row.retail_value_cents)
    }
  }

  getValuation(): InventoryValuation {
    const row = this.database
      .prepare(
        `SELECT COALESCE(SUM(stock_current), 0) AS total_units,
                COALESCE(SUM(stock_current * cost_price_cents), 0) AS cost_value_cents,
                COALESCE(SUM(stock_current * sale_price_cents), 0) AS retail_value_cents
         FROM products
         WHERE archived_at IS NULL`
      )
      .get() as unknown as TotalsRow

    return {
      totalUnits: Number(row.total_units),
      costValueCents: Number(row.cost_value_cents),
      retailValueCents: Number(row.retail_value_cents)
    }
  }
}

function mapProduct(row: ProductRow): Product {
  const stockCurrent = Number(row.stock_current)
  const stockMinimum = Number(row.stock_minimum)

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    costPriceCents: Number(row.cost_price_cents),
    salePriceCents: Number(row.sale_price_cents),
    stockCurrent,
    stockMinimum,
    lowStock: stockCurrent <= stockMinimum,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function mapMovement(row: MovementRow): StockMovement {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productSku: row.product_sku,
    type: row.type,
    quantity: Number(row.quantity),
    stockBefore: Number(row.stock_before),
    stockAfter: Number(row.stock_after),
    note: row.note,
    createdAt: row.created_at
  }
}

function toLikePattern(term: string): string {
  const escaped = term.replace(/[\\%_]/g, (character) => `\\${character}`)
  return `%${escaped}%`
}
