import type { ApiConnection } from '../../../shared/ipc'
import type { BusinessProfile, BusinessUpdateInput } from '../../../shared/types/business'
import type { PlanConfig } from '../../../shared/types/plan'
import type { SystemInfo } from '../../../shared/types/system'

export class ApiError extends Error {
  readonly status: number
  readonly fields?: Record<string, string>

  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

let connectionPromise: Promise<ApiConnection> | null = null

function resolveConnection(): Promise<ApiConnection> {
  if (!connectionPromise) {
    connectionPromise = (async () => {
      if (!window.minierp) {
        throw new ApiError(
          'Ejecuta MiniERP desde la aplicación de escritorio para acceder a los servicios locales.',
          0
        )
      }
      return window.minierp.getConnection()
    })()
  }

  return connectionPromise
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const connection = await resolveConnection()
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  headers.set('Authorization', `Bearer ${connection.token}`)
  if (init?.body) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${connection.baseUrl}${path}`, {
    ...init,
    headers
  })

  if (!response.ok) {
    let payload: { message?: string; fields?: Record<string, string> } = {}
    try {
      payload = (await response.json()) as typeof payload
    } catch {
      payload = {}
    }

    throw new ApiError(
      payload.message ?? 'No se pudo completar la operación.',
      response.status,
      payload.fields
    )
  }

  return (await response.json()) as T
}

export const api = {
  getBusiness: () => request<BusinessProfile>('/api/business'),
  updateBusiness: (input: BusinessUpdateInput) =>
    request<BusinessProfile>('/api/business', {
      method: 'PUT',
      body: JSON.stringify(input)
    }),
  getPlan: () => request<PlanConfig>('/api/plan'),
  getSystemInfo: () => request<SystemInfo>('/api/system')
}
