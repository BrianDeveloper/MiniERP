import type {
  FinancialMovement,
  FinancialMovementInput,
  FinanceMovementFilters,
  FinancePeriod,
  FinanceSummary,
  SaleInput,
  SaleResult
} from '../../../shared/types/finance'
import { request } from './client'

export const financeApi = {
  getSummary(period: FinancePeriod = 'all') {
    const params = new URLSearchParams({ period })
    return request<FinanceSummary>(`/api/finance/summary?${params.toString()}`)
  },

  listMovements(filters: FinanceMovementFilters = {}) {
    const params = new URLSearchParams()
    if (filters.period) params.set('period', filters.period)
    if (filters.type) params.set('type', filters.type)
    const search = filters.search?.trim()
    if (search) params.set('search', search)
    const query = params.toString()

    return request<FinancialMovement[]>(`/api/finance/movements${query ? `?${query}` : ''}`)
  },

  createMovement(input: FinancialMovementInput) {
    return request<FinancialMovement>('/api/finance/movements', {
      method: 'POST',
      body: JSON.stringify(input)
    })
  },

  deleteMovement(id: string) {
    return request<{ ok: boolean }>(`/api/finance/movements/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
  },

  createSale(input: SaleInput) {
    return request<SaleResult>('/api/finance/sales', {
      method: 'POST',
      body: JSON.stringify(input)
    })
  }
}
