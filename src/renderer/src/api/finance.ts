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
  getSummary(filters: FinanceMovementFilters = {}) {
    return request<FinanceSummary>(`/api/finance/summary?${buildQuery(filters)}`)
  },

  listMovements(filters: FinanceMovementFilters = {}) {
    const query = buildQuery(filters)
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

function buildQuery(filters: FinanceMovementFilters): string {
  const params = new URLSearchParams()
  if (filters.period) params.set('period', filters.period)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.type) params.set('type', filters.type)
  const search = filters.search?.trim()
  if (search) params.set('search', search)
  return params.toString()
}
