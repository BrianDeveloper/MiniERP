import { timingSafeEqual } from 'node:crypto'
import type { RequestHandler } from 'express'

const PREFIX = 'Bearer '

export function requireAuth(token: string): RequestHandler {
  const expected = Buffer.from(token, 'utf8')

  return (request, response, next) => {
    const header = request.header('authorization') ?? ''

    if (!header.startsWith(PREFIX)) {
      response.status(401).json({
        error: 'unauthorized',
        message: 'La sesión local no es válida.'
      })
      return
    }

    const provided = Buffer.from(header.slice(PREFIX.length), 'utf8')
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      response.status(401).json({
        error: 'unauthorized',
        message: 'La sesión local no es válida.'
      })
      return
    }

    next()
  }
}
