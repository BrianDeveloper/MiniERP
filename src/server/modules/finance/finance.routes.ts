import { Router } from 'express'
import type { PlanConfig } from '../../../shared/types/plan'
import { requireModule } from '../../middleware/require-module'
import { parsePeriodFilter, parseTypeFilter, parseFinancialMovement, parseSale } from './finance.validation'
import type { FinanceService } from './finance.service'

export function createFinanceRouter(
  finance: FinanceService,
  getPlan: () => PlanConfig
): Router {
  const router = Router()

  router.use(requireModule(getPlan, 'finance'))

  router.get('/summary', (request, response) => {
    response.json(finance.getSummary(parsePeriodFilter(request.query.period)))
  })

  router.get('/movements', (request, response) => {
    const period = parsePeriodFilter(request.query.period)
    const type = parseTypeFilter(request.query.type)
    const search = typeof request.query.search === 'string' ? request.query.search : ''

    response.json(finance.listMovements({ period, type, search }))
  })

  router.post('/movements', (request, response) => {
    const movement = finance.createMovement(parseFinancialMovement(request.body))
    response.status(201).json(movement)
  })

  router.delete('/movements/:id', (request, response) => {
    finance.deleteMovement(request.params.id)
    response.json({ ok: true })
  })

  router.post('/sales', requireModule(getPlan, 'inventory'), (request, response) => {
    const sale = finance.createSale(parseSale(request.body))
    response.status(201).json(sale)
  })

  return router
}
