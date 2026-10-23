import express, { type Express, type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import type { ConfigService } from './config/config-service'
import { AppError } from './errors'
import { requireAuth } from './middleware/require-auth'
import { createFinanceRouter } from './modules/finance/finance.routes'
import type { FinanceService } from './modules/finance/finance.service'
import { createInventoryRouter } from './modules/inventory/inventory.routes'
import type { InventoryService } from './modules/inventory/inventory.service'
import { createBusinessRouter } from './routes/business'
import { createPlanRouter } from './routes/plan'
import { createSystemRouter } from './routes/system'

export interface ApiAppOptions {
  config: ConfigService
  inventory: InventoryService
  finance: FinanceService
  token: string
  appVersion: string
  databaseFile: string
}

export function createApiApp({
  config,
  inventory,
  finance,
  token,
  appVersion,
  databaseFile
}: ApiAppOptions): Express {
  const app = express()

  app.disable('x-powered-by')
  app.use(cors())
  app.use(express.json({ limit: '64kb' }))
  app.use('/api', requireAuth(token))

  app.get('/api/health', (_request, response) => {
    response.json({
      status: 'ok',
      version: appVersion,
      uptime: Math.round(process.uptime())
    })
  })

  app.use('/api/business', createBusinessRouter(config))
  app.use('/api/plan', createPlanRouter(config))
  app.use('/api/system', createSystemRouter(config, appVersion, databaseFile))
  app.use('/api/inventory', createInventoryRouter(inventory, () => config.getPlan()))
  app.use('/api/finance', createFinanceRouter(finance, () => config.getPlan()))

  app.use((_request, response) => {
    response.status(404).json({
      error: 'not_found',
      message: 'El recurso solicitado no existe.'
    })
  })

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof AppError) {
      response.status(error.status).json({
        error: error.code,
        message: error.message,
        fields: error.fields
      })
      return
    }

    const err = error as Error & { code?: string }
    if (err.code === 'SQLITE_BUSY') {
      response.status(503).json({
        error: 'database_busy',
        message: 'La base de datos está ocupada. Intenta de nuevo en unos segundos.'
      })
      return
    }

    if (err.code === 'SQLITE_READONLY' || err.code === 'SQLITE_CANTOPEN') {
      response.status(500).json({
        error: 'database_unavailable',
        message: 'No se puede acceder a la base de datos local. Verifica permisos o espacio en disco.'
      })
      return
    }

    console.error('[minierp] API error:', err.message)
    response.status(500).json({
      error: 'internal_error',
      message: 'Ocurrió un error interno.'
    })
  })

  return app
}
