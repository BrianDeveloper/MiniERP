import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { AppError } from '../../errors'
import type {
  InventorySummary,
  InventoryValuation,
  MovementFilters,
  Product,
  ProductCreateInput,
  ProductFilters,
  ProductUpdateInput,
  StockMovement,
  StockMovementInput
} from '../../../shared/types/inventory'
import { withTransaction } from '../../db/transaction'
import { InventoryRepository } from './inventory.repository'

const MAX_STOCK = 1_000_000_000

export class InventoryService {
  private readonly repository: InventoryRepository

  constructor(private readonly database: DatabaseSync) {
    this.repository = new InventoryRepository(database)
  }

  listProducts(filters: ProductFilters = {}): Product[] {
    return this.repository.listProducts({
      search: filters.search?.trim() ?? '',
      lowStockOnly: Boolean(filters.lowStockOnly)
    })
  }

  getProduct(id: string): Product {
    const product = this.repository.findProduct(id)
    if (!product) {
      throw new AppError('El producto no existe o fue archivado.', 404, 'product_not_found')
    }
    return product
  }

  createProduct(input: ProductCreateInput): Product {
    this.ensureSkuAvailable(input.sku)

    const now = new Date().toISOString()
    const id = randomUUID()

    withTransaction(this.database, () => {
      this.repository.insertProduct({
        ...input,
        id,
        stockCurrent: input.initialStock,
        createdAt: now,
        updatedAt: now
      })

      if (input.initialStock > 0) {
        this.repository.insertMovement({
          id: randomUUID(),
          productId: id,
          type: 'in',
          quantity: input.initialStock,
          stockBefore: 0,
          stockAfter: input.initialStock,
          note: 'Stock inicial',
          createdAt: now
        })
      }
    })

    return this.getProduct(id)
  }

  updateProduct(id: string, input: ProductUpdateInput): Product {
    const current = this.getProduct(id)
    if (current.sku.toLowerCase() !== input.sku.toLowerCase()) {
      this.ensureSkuAvailable(input.sku, id)
    }

    this.repository.updateProduct(id, input, new Date().toISOString())
    return this.getProduct(id)
  }

  archiveProduct(id: string): void {
    this.getProduct(id)
    this.repository.archiveProduct(id, new Date().toISOString())
  }

  registerMovement(input: StockMovementInput): StockMovement {
    const product = this.getProduct(input.productId)

    if (input.type === 'out' && input.quantity > product.stockCurrent) {
      throw new AppError(
        `Stock insuficiente: hay ${product.stockCurrent} unidades disponibles.`,
        409,
        'insufficient_stock',
        { quantity: 'La cantidad supera el stock disponible.' }
      )
    }

    const stockBefore = product.stockCurrent
    const stockAfter =
      input.type === 'in' ? stockBefore + input.quantity : stockBefore - input.quantity

    if (stockAfter > MAX_STOCK) {
      throw new AppError(
        'El stock resultante supera el máximo permitido.',
        400,
        'stock_overflow',
        { quantity: 'La cantidad es demasiado alta.' }
      )
    }

    const createdAt = new Date().toISOString()
    const movement: StockMovement = {
      id: randomUUID(),
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      type: input.type,
      quantity: input.quantity,
      stockBefore,
      stockAfter,
      note: input.note,
      createdAt
    }

    withTransaction(this.database, () => {
      this.repository.updateStock(product.id, stockAfter, createdAt)
      this.repository.insertMovement({
        id: movement.id,
        productId: movement.productId,
        type: movement.type,
        quantity: movement.quantity,
        stockBefore: movement.stockBefore,
        stockAfter: movement.stockAfter,
        note: movement.note,
        createdAt: movement.createdAt
      })
    })

    return movement
  }

  listMovements(filters: MovementFilters = {}): StockMovement[] {
    const limit = Math.min(Math.max(Math.floor(filters.limit ?? 60), 1), 200)
    return this.repository.listMovements({
      productId: filters.productId,
      limit
    })
  }

  getSummary(): InventorySummary {
    return this.repository.getSummary()
  }

  getValuation(): InventoryValuation {
    return this.repository.getValuation()
  }

  private ensureSkuAvailable(sku: string, excludeId?: string): void {
    if (this.repository.findActiveBySku(sku, excludeId)) {
      throw new AppError(
        'Ya existe un producto con ese SKU.',
        409,
        'sku_in_use',
        { sku: 'Este SKU ya está registrado.' }
      )
    }
  }
}
