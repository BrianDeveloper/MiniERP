import {
  AlertTriangle,
  ArrowLeftRight,
  Archive,
  Boxes,
  CheckCircle2,
  Package,
  Plus,
  Search,
  Wallet,
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import type {
  InventorySummary,
  Product,
  StockMovement
} from '../../../../shared/types/inventory'
import { inventoryApi } from '../../api/inventory'
import { useAppData } from '../../app/AppDataProvider'
import { LockedModulePanel } from '../../components/LockedModulePanel'
import { Modal } from '../../components/Modal'
import { WorkspaceShell } from '../../components/WorkspaceShell'
import { formatMoney, formatNumber } from '../../lib/format'
import { useDebouncedValue } from '../../lib/useDebouncedValue'
import { canOpenModule, getModule, type AppModule } from '../registry'
import { MovementHistory } from './MovementHistory'
import { MovementModal } from './MovementModal'
import { ProductFormModal } from './ProductFormModal'
import { ProductTable } from './ProductTable'
import { useEntitlements } from '../../hooks/useEntitlements'

type TabId = 'products' | 'movements'

interface Notice {
  tone: 'success' | 'error'
  text: string
}

interface MovementEditor {
  products: Product[]
  productId: string | null
}

export function InventoryPage() {
  const { plan } = useAppData()
  const module = getModule('inventory')

  if (!module) {
    return <Navigate to="/" replace />
  }

  if (!canOpenModule(module, plan)) {
    return (
      <WorkspaceShell
        title={module.title}
        subtitle={module.kicker}
        icon={module.icon}
        accent={module.accent}
        actions={<span className="workspace-badge is-locked">Bloqueado por plan</span>}
      >
        <LockedModulePanel module={module} />
      </WorkspaceShell>
    )
  }

  return <InventoryWorkspace module={module} />
}

function InventoryWorkspace({ module }: { module: AppModule }) {
  const { business, plan } = useAppData()
  const { entitlements } = useEntitlements()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 250)
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [tab, setTab] = useState<TabId>('products')

  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingMovements, setLoadingMovements] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [overviewError, setOverviewError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  const [editor, setEditor] = useState<{ product: Product | null } | null>(null)
  const [movementEditor, setMovementEditor] = useState<MovementEditor | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingProducts(true)
    setProductsError(null)

    inventoryApi
      .listProducts({ search: debouncedSearch, lowStockOnly })
      .then((data) => {
        if (!cancelled) setProducts(data)
      })
      .catch((error: unknown) => {
        if (!cancelled) setProductsError(toMessage(error))
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedSearch, lowStockOnly, refreshToken])

  useEffect(() => {
    let cancelled = false
    setLoadingMovements(true)
    setOverviewError(null)

    Promise.all([inventoryApi.getSummary(), inventoryApi.listMovements({ limit: 60 })])
      .then(([nextSummary, nextMovements]) => {
        if (cancelled) return
        setSummary(nextSummary)
        setMovements(nextMovements)
      })
      .catch((error: unknown) => {
        if (!cancelled) setOverviewError(toMessage(error))
      })
      .finally(() => {
        if (!cancelled) setLoadingMovements(false)
      })

    return () => {
      cancelled = true
    }
  }, [refreshToken])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 5000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const activeError = productsError ?? overviewError
  const hasFilters = debouncedSearch.trim().length > 0 || lowStockOnly
  const locale = business.locale

  function refresh(): void {
    setRefreshToken((value) => value + 1)
  }

  function handleSaved(message: string): void {
    setEditor(null)
    setMovementEditor(null)
    setNotice({ tone: 'success', text: message })
    refresh()
  }

  async function openMovement(product: Product | null): Promise<void> {
    try {
      const allProducts = await inventoryApi.listProducts()
      setMovementEditor({ products: allProducts, productId: product?.id ?? null })
    } catch (error) {
      setNotice({ tone: 'error', text: toMessage(error) })
    }
  }

  async function confirmArchive(): Promise<void> {
    if (!archiveTarget) return

    setArchiving(true)
    try {
      await inventoryApi.archiveProduct(archiveTarget.id)
      setNotice({
        tone: 'success',
        text: `"${archiveTarget.name}" fue archivado. Su historial se conserva.`
      })
      setArchiveTarget(null)
      refresh()
    } catch (error) {
      setNotice({ tone: 'error', text: toMessage(error) })
    } finally {
      setArchiving(false)
    }
  }

  function clearFilters(): void {
    setSearch('')
    setLowStockOnly(false)
  }

  return (
    <WorkspaceShell
      title={module.title}
      subtitle={module.kicker}
      icon={module.icon}
      accent={module.accent}
      actions={
        <div className="inv-header-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={() => void openMovement(null)}
            disabled={(summary !== null && summary.productCount === 0) || !entitlements.features.inventory.stockMovement}
            title={!entitlements.features.inventory.stockMovement ? 'Deshabilitado por permisos' : undefined}
          >
            <ArrowLeftRight size={15} />
            Movimiento
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => setEditor({ product: null })}
            disabled={!entitlements.features.inventory.createProduct}
            title={!entitlements.features.inventory.createProduct ? 'Deshabilitado por permisos' : undefined}
          >
            <Plus size={15} />
            Nuevo producto
          </button>
        </div>
      }
    >
      <div className="inventory-page">
        {notice ? (
        <div
          className={`inv-notice is-${notice.tone}`}
          role={notice.tone === 'error' ? 'alert' : 'status'}
        >
          {notice.tone === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{notice.text}</span>
          <button
            type="button"
            className="inv-notice-close"
            aria-label="Cerrar aviso"
            onClick={() => setNotice(null)}
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      <section className="inv-summary-grid" aria-label="Resumen del inventario">
        <article className="inv-stat">
          <span className="inv-stat-icon">
            <Boxes size={18} />
          </span>
          <div className="inv-stat-body">
            <span className="inv-stat-label">Productos activos</span>
            <strong className="inv-stat-value">
              {summary ? formatNumber(summary.productCount, locale) : '—'}
            </strong>
            <span className="inv-stat-foot">En el catálogo</span>
          </div>
        </article>

        <article className="inv-stat">
          <span className="inv-stat-icon">
            <Package size={18} />
          </span>
          <div className="inv-stat-body">
            <span className="inv-stat-label">Unidades en stock</span>
            <strong className="inv-stat-value">
              {summary ? formatNumber(summary.totalUnits, locale) : '—'}
            </strong>
            <span className="inv-stat-foot">Suma de existencias</span>
          </div>
        </article>

        <article className={`inv-stat${summary && summary.lowStockCount > 0 ? ' is-warning' : ''}`}>
          <span className="inv-stat-icon">
            <AlertTriangle size={18} />
          </span>
          <div className="inv-stat-body">
            <span className="inv-stat-label">Stock bajo</span>
            <strong className="inv-stat-value">
              {summary ? formatNumber(summary.lowStockCount, locale) : '—'}
            </strong>
            <span className="inv-stat-foot">
              {summary && summary.lowStockCount > 0 ? 'Requieren reposición' : 'Todo en orden'}
            </span>
          </div>
        </article>

        <article className="inv-stat">
          <span className="inv-stat-icon">
            <Wallet size={18} />
          </span>
          <div className="inv-stat-body">
            <span className="inv-stat-label">Valor al costo</span>
            <strong className="inv-stat-value is-money">
              {summary
                ? formatMoney(summary.costValueCents, locale, business.currency)
                : '—'}
            </strong>
            <span className="inv-stat-foot">Inventario valorizado</span>
          </div>
        </article>
      </section>

      <div className="inv-tabs" role="tablist" aria-label="Vistas del inventario">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'products'}
          className={tab === 'products' ? 'is-active' : undefined}
          onClick={() => setTab('products')}
        >
          Productos
          {summary ? <span>{formatNumber(summary.productCount, locale)}</span> : null}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'movements'}
          className={tab === 'movements' ? 'is-active' : undefined}
          onClick={() => setTab('movements')}
        >
          Movimientos
          <span>{movements.length}</span>
        </button>
      </div>

      {activeError ? (
        <div className="form-message error inv-error" role="alert">
          <AlertTriangle size={16} />
          <span>{activeError}</span>
          <button type="button" className="inv-retry" onClick={refresh}>
            Reintentar
          </button>
        </div>
      ) : null}

      {tab === 'products' ? (
        <div role="tabpanel">
          <div className="inv-toolbar">
            <div className="inv-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value.replace(/[\x00-\x1F\x7F]/g, ' ').slice(0, 100))}
                placeholder="Buscar por nombre, SKU o categoría..."
                aria-label="Buscar productos"
              />
              {search ? (
                <button
                  type="button"
                  className="inv-search-clear"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setSearch('')}
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>

            <button
              type="button"
              className={`inv-filter${lowStockOnly ? ' is-active' : ''}`}
              aria-pressed={lowStockOnly}
              onClick={() => setLowStockOnly((value) => !value)}
            >
              <AlertTriangle size={14} />
              Solo stock bajo
            </button>

            {loadingProducts && products.length > 0 ? (
              <span className="inv-updating">Actualizando...</span>
            ) : null}
          </div>

          {loadingProducts && products.length === 0 ? (
            <div className="inv-loading">
              <span className="spinner" />
              <p>Cargando inventario...</p>
            </div>
          ) : products.length > 0 ? (
            <ProductTable
              products={products}
              locale={locale}
              currency={business.currency}
              onEdit={entitlements.features.inventory.editProduct ? (product) => setEditor({ product }) : undefined}
              onMovement={entitlements.features.inventory.stockMovement ? (product) => void openMovement(product) : undefined}
              onArchive={entitlements.features.inventory.archiveProduct ? (product) => setArchiveTarget(product) : undefined}
            />
          ) : productsError ? null : (
            <section className="inv-empty">
              <span className="inv-empty-icon">
                <Boxes size={24} />
              </span>
              <h2>{hasFilters ? 'Sin resultados' : 'Tu inventario está vacío'}</h2>
              <p>
                {hasFilters
                  ? 'No hay productos que coincidan con la búsqueda o el filtro aplicado.'
                  : 'Crea tu primer producto para comenzar a controlar existencias, entradas y salidas.'}
              </p>
              {hasFilters ? (
                <button type="button" className="ghost-button" onClick={clearFilters}>
                  Limpiar filtros
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setEditor({ product: null })}
                >
                  <Plus size={15} />
                  Crear producto
                </button>
              )}
            </section>
          )}
        </div>
      ) : (
        <div role="tabpanel">
          <MovementHistory
            movements={movements}
            loading={loadingMovements}
            locale={locale}
          />
        </div>
      )}

      {editor ? (
        <ProductFormModal
          product={editor.product}
          currency={business.currency}
          onClose={() => setEditor(null)}
          onSaved={handleSaved}
        />
      ) : null}

      {movementEditor ? (
        <MovementModal
          products={movementEditor.products}
          initialProductId={movementEditor.productId}
          locale={locale}
          currency={business.currency}
          financeEnabled={plan.modules.finance.enabled}
          onClose={() => setMovementEditor(null)}
          onSaved={handleSaved}
        />
      ) : null}

      {archiveTarget ? (
        <Modal
          title="Archivar producto"
          subtitle={`${archiveTarget.name} · ${archiveTarget.sku}`}
          onClose={() => {
            if (!archiving) setArchiveTarget(null)
          }}
        >
          <p className="confirm-copy">
            El producto dejará de aparecer en el inventario, pero su historial de movimientos se
            conservará. Podrás reutilizar su SKU en otro producto.
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => setArchiveTarget(null)}
              disabled={archiving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="danger-button"
              onClick={() => void confirmArchive()}
              disabled={archiving}
            >
              <Archive size={15} />
              {archiving ? 'Archivando...' : 'Archivar producto'}
            </button>
          </div>
        </Modal>
      ) : null}
      </div>
    </WorkspaceShell>
  )
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo completar la operación.'
}
