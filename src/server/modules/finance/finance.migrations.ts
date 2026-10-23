import type { Migration } from '../../db/migration-runner'

export const financeMigrations: Migration[] = [
  {
    id: '002_finance',
    up: `
      CREATE TABLE financial_movements (
        id TEXT PRIMARY KEY,
        occurred_on TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        concept TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT '',
        source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'sale')),
        inventory_movement_id TEXT REFERENCES stock_movements (id) ON DELETE RESTRICT,
        created_at TEXT NOT NULL,
        CHECK (
          (source = 'manual' AND inventory_movement_id IS NULL) OR
          (source = 'sale' AND inventory_movement_id IS NOT NULL)
        )
      );

      CREATE INDEX idx_financial_movements_occurred
        ON financial_movements (occurred_on DESC, created_at DESC);

      CREATE INDEX idx_financial_movements_type
        ON financial_movements (type, occurred_on DESC);

      CREATE UNIQUE INDEX idx_financial_movements_inventory
        ON financial_movements (inventory_movement_id)
        WHERE inventory_movement_id IS NOT NULL;
    `
  }
]
