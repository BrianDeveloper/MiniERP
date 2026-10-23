export interface Product {
  id: string
  sku: string
  name: string
  category: string
  costPriceCents: number
  salePriceCents: number
  stockCurrent: number
  stockMinimum: number
  lowStock: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductCreateInput {
  sku: string
  name: string
  category: string
  costPriceCents: number
  salePriceCents: number
  stockMinimum: number
  initialStock: number
}

export interface ProductUpdateInput {
  sku: string
  name: string
  category: string
  costPriceCents: number
  salePriceCents: number
  stockMinimum: number
}

export interface ProductFilters {
  search?: string
  lowStockOnly?: boolean
}

export const STOCK_MOVEMENT_TYPES = ['in', 'out'] as const
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number]

export interface StockMovement {
  id: string
  productId: string
  productName: string
  productSku: string
  type: StockMovementType
  quantity: number
  stockBefore: number
  stockAfter: number
  note: string
  createdAt: string
}

export interface StockMovementInput {
  productId: string
  type: StockMovementType
  quantity: number
  note: string
}

export interface MovementFilters {
  productId?: string
  limit?: number
}

export interface InventorySummary {
  productCount: number
  totalUnits: number
  lowStockCount: number
  costValueCents: number
  retailValueCents: number
}

export interface InventoryValuation {
  totalUnits: number
  costValueCents: number
  retailValueCents: number
}
