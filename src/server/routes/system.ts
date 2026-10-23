import { Router } from 'express'
import type { ConfigService } from '../config/config-service'

export function createSystemRouter(
  config: ConfigService,
  appVersion: string,
  databaseFile: string
): Router {
  const router = Router()

  router.get('/', (_request, response) => {
    response.json(config.getSystemInfo(appVersion, process.platform, databaseFile))
  })

  return router
}
