import { createServer, type Server } from 'node:http'
import { join } from 'node:path'
import type { ConfigService } from './config/config-service'
import { createApiApp } from './app'
import { openDatabase } from './db/database'
import { appMigrations } from './db/migrations'
import { FinanceService } from './modules/finance/finance.service'
import { InventoryService } from './modules/inventory/inventory.service'

export interface StartApiOptions {
  config: ConfigService
  token: string
  appVersion: string
  dataDir: string
  host?: string
  port?: number
}

export interface RunningApi {
  port: number
  close(): Promise<void>
}

export async function startApiServer(options: StartApiOptions): Promise<RunningApi> {
  const { config, token, appVersion, dataDir, host = '127.0.0.1', port = 0 } = options
  const databaseFile = join(dataDir, 'data', 'minierp.db')
  const database = openDatabase(databaseFile, appMigrations)
  const inventory = new InventoryService(database)
  const finance = new FinanceService(database, inventory)
  const app = createApiApp({ config, inventory, finance, token, appVersion, databaseFile })
  const server = createServer(app)

  try {
    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error): void => {
        server.removeListener('listening', onListening)
        reject(error)
      }
      const onListening = (): void => {
        server.removeListener('error', onError)
        resolve()
      }

      server.once('error', onError)
      server.once('listening', onListening)
      server.listen(port, host)
    })
  } catch (error) {
    database.close()
    throw error
  }

  return {
    port: getPort(server),
    close: async () => {
      await closeServer(server)
      database.close()
    }
  }
}

function getPort(server: Server): number {
  const address = server.address()
  if (typeof address === 'object' && address !== null) return address.port
  return 0
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => resolve())
    server.closeAllConnections()
  })
}
