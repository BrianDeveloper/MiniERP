import type { NextFunction, Request, Response } from 'express'
import type { ConfigService } from '../config/config-service'
import { AppError } from '../errors'
import type { EntitlementModuleId } from '../../shared/types/entitlements'

export function requireFeature(
  config: ConfigService,
  moduleId: EntitlementModuleId,
  feature: string
) {
  return (_request: Request, _response: Response, next: NextFunction): void => {
    try {
      const entitlements = config.getEntitlements()
      const mod = entitlements.modules?.[moduleId]
      if (mod && mod.enabled === false) {
        next(new AppError('Este módulo está deshabilitado por permisos.', 403, 'module_disabled'))
        return
      }
      const features = ((entitlements.features as unknown) as Record<string, Record<string, boolean>>)[moduleId] ?? {}
      if (features[feature] === false) {
        next(
          new AppError(
            'Esta funcionalidad está deshabilitada por permisos.',
            403,
            'feature_disabled'
          )
        )
        return
      }
      next()
    } catch (error) {
      if (error instanceof AppError) {
        next(error)
        return
      }
      next(new AppError('Esta funcionalidad está deshabilitada por permisos.', 403, 'feature_disabled'))
    }
  }
}
