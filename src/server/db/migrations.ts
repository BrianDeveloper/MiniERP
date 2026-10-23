import { financeMigrations } from '../modules/finance/finance.migrations'
import { inventoryMigrations } from '../modules/inventory/inventory.migrations'
import type { Migration } from './migration-runner'

export const appMigrations: Migration[] = [...inventoryMigrations, ...financeMigrations]
