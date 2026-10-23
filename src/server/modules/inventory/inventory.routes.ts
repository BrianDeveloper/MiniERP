import { Router } from 'express'
import type { PlanConfig } from '../../../shared/types/plan'
import type { ConfigService } from '../../config/config-service'
import { requireModule } from '../../middleware/require-module'
import { requireFeature } from '../../middleware/require-feature'
import type { InventoryService } from './inventory.service'
import {
  parseProductCreate,
  parseProductUpdate,
  parseStockMovement
} from './inventory.validation'

export function createInventoryRouter(
  inventory: InventoryService,
  getPlan: () => PlanConfig,
  config?: ConfigService
): Router {
  const router = Router()

  router.use(requireModule(getPlan, 'inventory'))

  router.get('/summary', (_request, response) => {
    response.json(inventory.getSummary())
  })

  router.get('/products', (request, response) => {
    const search = typeof request.query.search === 'string' ? request.query.search : ''
    const lowStockOnly = request.query.lowStock === 'true'

    response.json(inventory.listProducts({ search, lowStockOnly }))
  })

  router.post('/products', config ? requireFeature(config, 'inventory', 'createProduct') : (_req, _res, next) => next(), (request, response) => {
    const product = inventory.createProduct(parseProductCreate(request.body))
    response.status(201).json(product)
  })

  router.get('/products/:id', (request, response) => {
    response.json(inventory.getProduct(request.params.id))
  })

  router.put('/products/:id', config ? requireFeature(config, 'inventory', 'editProduct') : (_req, _res, next) => next(), (request, response) => {
    const product = inventory.updateProduct(
      request.params.id,
      parseProductUpdate(request.body)
    )
    response.json(product)
  })

  router.delete('/products/:id', config ? requireFeature(config, 'inventory', 'archiveProduct') : (_req, _res, next) => next(), (request, response) => {
    inventory.archiveProduct(request.params.id)
    response.json({ ok: true })
  })

  router.get('/movements', (request, response) => {
    const productId =
      typeof request.query.productId === 'string' ? request.query.productId : undefined
    const requestedLimit = Number(request.query.limit)
    const limit = Number.isFinite(requestedLimit) ? requestedLimit : undefined

    response.json(inventory.listMovements({ productId, limit }))
  })

  router.post('/movements', config ? requireFeature(config, 'inventory', 'stockMovement') : (_req, _res, next) => next(), (request, response) => {
    const movement = inventory.registerMovement(parseStockMovement(request.body))
    response.status(201).json(movement)
  })

  return router
}
