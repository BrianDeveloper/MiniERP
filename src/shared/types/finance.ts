import type { StockMovement } from './inventory'

export const FINANCE_PERIODS = ['today', 'month', 'all'] as const
export type FinancePeriod = (typeof FINANCE_PERIODS)[number]

export const FINANCIAL_MOVEMENT_TYPES = ['income', 'expense'] as const
export type FinancialMovementType = (typeof FINANCIAL_MOVEMENT_TYPES)[number]

export const FINANCIAL_MOVEMENT_SOURCES = ['manual', 'sale'] as const
export type FinancialMovementSource = (typeof FINANCIAL_MOVEMENT_SOURCES)[number]

export interface FinancialMovement {
  id: string
  occurredOn: string
  type: FinancialMovementType
  amountCents: number
  concept: string
  category: string
  source: FinancialMovementSource
  inventoryMovementId: string | null
  productName: string | null
  productSku: string | null
  quantity: number | null
  createdAt: string
}

export interface FinancialMovementInput {
  occurredOn: string
  type: FinancialMovementType
  amountCents: number
  concept: string
  category: string
}

export interface FinanceMovementFilters {
  period?: FinancePeriod
  type?: FinancialMovementType
  search?: string
}

export interface FinanceSummary {
  incomeCents: number
  expenseCents: number
  balanceCents: number
  movementCount: number
  incomeCount: number
  expenseCount: number
}

export interface SaleInput {
  occurredOn: string
  productId: string
  quantity: number
  unitPriceCents: number
  note: string
}

export interface SaleResult {
  financialMovement: FinancialMovement
  stockMovement: StockMovement
}
