import { Router } from 'express'
import type { PlanConfig } from '../../../shared/types/plan'
import { requireModule } from '../../middleware/require-module'
import type { InventoryService } from './inventory.service'
import {
  parseProductCreate,
  parseProductUpdate,
  parseStockMovement
} from './inventory.validation'

export function createInventoryRouter(
  inventory: InventoryService,
  getPlan: () => PlanConfig
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

  router.post('/products', (request, response) => {
    const product = inventory.createProduct(parseProductCreate(request.body))
    response.status(201).json(product)
  })

  router.get('/products/:id', (request, response) => {
    response.json(inventory.getProduct(request.params.id))
  })

  router.put('/products/:id', (request, response) => {
    const product = inventory.updateProduct(
      request.params.id,
      parseProductUpdate(request.body)
    )
    response.json(product)
  })

  router.delete('/products/:id', (request, response) => {
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

  router.post('/movements', (request, response) => {
    const movement = inventory.registerMovement(parseStockMovement(request.body))
    response.status(201).json(movement)
  })

  return router
}
