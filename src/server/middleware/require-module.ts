import type { RequestHandler } from 'express'
import { isPlanModuleEnabled, type PlanConfig, type PlanModuleId } from '../../shared/types/plan'

export function requireModule(
  getPlan: () => PlanConfig,
  moduleId: PlanModuleId
): RequestHandler {
  return (_request, response, next) => {
    if (!isPlanModuleEnabled(getPlan(), moduleId)) {
      response.status(403).json({
        error: 'module_disabled',
        message: 'Este módulo no está incluido en el plan actual.'
      })
      return
    }

    next()
  }
}
