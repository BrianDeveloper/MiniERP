import { Router } from 'express'
import type { PlanConfig } from '../../../shared/types/plan'
import type { ConfigService } from '../../config/config-service'
import { requireModule } from '../../middleware/require-module'
import { requireFeature } from '../../middleware/require-feature'
import {
  parseDateRange,
  parsePeriodFilter,
  parseTypeFilter,
  parseFinancialMovement,
  parseSale
} from './finance.validation'
import { AppError } from '../../errors'
import type { FinanceService } from './finance.service'

export function createFinanceRouter(
  finance: FinanceService,
  getPlan: () => PlanConfig,
  config?: ConfigService
): Router {
  const router = Router()

  router.use(requireModule(getPlan, 'finance'))

  router.get('/summary', (request, response) => {
    const period = parsePeriodFilter(request.query.period)
    const range = parseDateRange(request.query)
    assertRangeAllowed(range, config)
    response.json(finance.getSummary({ period, ...range }))
  })

  router.get('/movements', (request, response) => {
    const period = parsePeriodFilter(request.query.period)
    const range = parseDateRange(request.query)
    assertRangeAllowed(range, config)
    const type = parseTypeFilter(request.query.type)
    const search = typeof request.query.search === 'string' ? request.query.search : ''

    response.json(finance.listMovements({ period, ...range, type, search }))
  })

  router.post('/movements', config ? requireFeature(config, 'finance', 'createManual') : (_req, _res, next) => next(), (request, response) => {
    const movement = finance.createMovement(parseFinancialMovement(request.body))
    response.status(201).json(movement)
  })

  router.delete('/movements/:id', config ? requireFeature(config, 'finance', 'deleteManual') : (_req, _res, next) => next(), (request, response) => {
    finance.deleteMovement(request.params.id)
    response.json({ ok: true })
  })

  router.post('/sales', requireModule(getPlan, 'inventory'), (request, response) => {
    const sale = finance.createSale(parseSale(request.body))
    response.status(201).json(sale)
  })

  return router
}

function assertRangeAllowed(
  range: { from?: string; to?: string },
  config?: ConfigService
): void {
  if (!range.from && !range.to) return
  if (!config) return

  const entitlements = config.getEntitlements()
  if (entitlements.features.finance.dateRangeCustom === false) {
    throw new AppError(
      'El rango de fechas personalizado está deshabilitado por permisos.',
      403,
      'feature_disabled'
    )
  }
}
