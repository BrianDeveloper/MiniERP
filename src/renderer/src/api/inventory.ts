import type {
  InventorySummary,
  MovementFilters,
  Product,
  ProductCreateInput,
  ProductFilters,
  ProductUpdateInput,
  StockMovement,
  StockMovementInput
} from '../../../shared/types/inventory'
import { request } from './client'

export const inventoryApi = {
  listProducts(filters: ProductFilters = {}) {
    const params = new URLSearchParams()
    const search = filters.search?.trim()
    if (search) params.set('search', search)
    if (filters.lowStockOnly) params.set('lowStock', 'true')
    const query = params.toString()

    return request<Product[]>(`/api/inventory/products${query ? `?${query}` : ''}`)
  },

  getProduct(id: string) {
    return request<Product>(`/api/inventory/products/${encodeURIComponent(id)}`)
  },

  createProduct(input: ProductCreateInput) {
    return request<Product>('/api/inventory/products', {
      method: 'POST',
      body: JSON.stringify(input)
    })
  },

  updateProduct(id: string, input: ProductUpdateInput) {
    return request<Product>(`/api/inventory/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input)
    })
  },

  archiveProduct(id: string) {
    return request<{ ok: boolean }>(`/api/inventory/products/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
  },

  getSummary() {
    return request<InventorySummary>('/api/inventory/summary')
  },

  listMovements(filters: MovementFilters = {}) {
    const params = new URLSearchParams()
    if (filters.productId) params.set('productId', filters.productId)
    if (filters.limit) params.set('limit', String(filters.limit))
    const query = params.toString()

    return request<StockMovement[]>(`/api/inventory/movements${query ? `?${query}` : ''}`)
  },

  createMovement(input: StockMovementInput) {
    return request<StockMovement>('/api/inventory/movements', {
      method: 'POST',
      body: JSON.stringify(input)
    })
  }
}
