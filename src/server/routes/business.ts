import { Router } from 'express'
import type { ConfigService } from '../config/config-service'
import { validateBusinessUpdate } from '../validation/business'

export function createBusinessRouter(config: ConfigService): Router {
  const router = Router()

  router.get('/', (_request, response) => {
    response.json(config.getBusiness())
  })

  router.put('/', async (request, response) => {
    const result = validateBusinessUpdate(request.body)

    if (!result.valid || !result.value) {
      response.status(400).json({
        error: 'validation_error',
        message: 'Revisa los datos del negocio.',
        fields: result.errors
      })
      return
    }

    const business = await config.updateBusiness(result.value)
    response.json(business)
  })

  return router
}
