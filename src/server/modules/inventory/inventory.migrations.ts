import type { Migration } from '../../db/migration-runner'

export const inventoryMigrations: Migration[] = [
  {
    id: '001_inventory',
    up: `
      CREATE TABLE products (
        id TEXT PRIMARY KEY,
        sku TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT '',
        cost_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (cost_price_cents >= 0),
        sale_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (sale_price_cents >= 0),
        stock_current INTEGER NOT NULL DEFAULT 0 CHECK (stock_current >= 0),
        stock_minimum INTEGER NOT NULL DEFAULT 0 CHECK (stock_minimum >= 0),
        archived_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE UNIQUE INDEX idx_products_sku_active
        ON products (sku COLLATE NOCASE)
        WHERE archived_at IS NULL;

      CREATE INDEX idx_products_name_active
        ON products (name COLLATE NOCASE)
        WHERE archived_at IS NULL;

      CREATE TABLE stock_movements (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
        type TEXT NOT NULL CHECK (type IN ('in', 'out')),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        stock_before INTEGER NOT NULL CHECK (stock_before >= 0),
        stock_after INTEGER NOT NULL CHECK (stock_after >= 0),
        note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );

      CREATE INDEX idx_stock_movements_product
        ON stock_movements (product_id, created_at DESC);

      CREATE INDEX idx_stock_movements_created
        ON stock_movements (created_at DESC);
    `
  }
]
