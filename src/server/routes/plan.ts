import { Router } from 'express'
import type { ConfigService } from '../config/config-service'

export function createPlanRouter(config: ConfigService): Router {
  const router = Router()

  router.get('/', (_request, response) => {
    response.json(config.getPlan())
  })

  return router
}
