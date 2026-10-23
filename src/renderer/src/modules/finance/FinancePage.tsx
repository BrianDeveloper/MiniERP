import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  List,
  Plus,
  Search,
  Trash2,
  Wallet,
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import type {
  FinancialMovement,
  FinancialMovementType,
  FinancePeriod,
  FinanceSummary
} from '../../../../shared/types/finance'
import { financeApi } from '../../api/finance'
import { useAppData } from '../../app/AppDataProvider'
import { LockedModulePanel } from '../../components/LockedModulePanel'
import { Modal } from '../../components/Modal'
import { WorkspaceShell } from '../../components/WorkspaceShell'
import { formatDate, formatMoney, formatNumber } from '../../lib/format'
import { useDebouncedValue } from '../../lib/useDebouncedValue'
import { canOpenModule, getModule, type AppModule } from '../registry'
import { FinanceMovementModal } from './FinanceMovementModal'
import { useEntitlements } from '../../hooks/useEntitlements'

type TypeFilter = 'all' | FinancialMovementType

interface Notice {
  tone: 'success' | 'error'
  text: string
}

const PERIOD_OPTIONS: { id: FinancePeriod; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'month', label: 'Este mes' },
  { id: 'all', label: 'Todo' }
]

const TYPE_OPTIONS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'income', label: 'Ingresos' },
  { id: 'expense', label: 'Egresos' }
]

export function FinancePage() {
  const { plan } = useAppData()
  const module = getModule('finance')

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

  return <FinanceWorkspace module={module} />
}

function FinanceWorkspace({ module }: { module: AppModule }) {
  const { business } = useAppData()
  const { entitlements } = useEntitlements()
  const [period, setPeriod] = useState<FinancePeriod>('month')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const debouncedSearch = useDebouncedValue(search, 250)

  const customRangeEnabled = entitlements.features.finance.dateRangeCustom
  const usingCustomRange = customRangeEnabled && (fromDate !== '' || toDate !== '')
  const rangeError =
    usingCustomRange && fromDate !== '' && toDate !== '' && fromDate > toDate
      ? 'La fecha "Desde" no puede ser posterior a "Hasta".'
      : null
  const rangeFilters = usingCustomRange
    ? { from: fromDate || undefined, to: toDate || undefined }
    : { period }

  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [movements, setMovements] = useState<FinancialMovement[]>([])
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingMovements, setLoadingMovements] = useState(true)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [movementsError, setMovementsError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  const [editorOpen, setEditorOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FinancialMovement | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingSummary(true)
    setSummaryError(rangeError)

    if (rangeError) {
      setLoadingSummary(false)
      return () => {
        cancelled = true
      }
    }

    financeApi
      .getSummary(rangeFilters)
      .then((data) => {
        if (!cancelled) setSummary(data)
      })
      .catch((error: unknown) => {
        if (!cancelled) setSummaryError(toMessage(error))
      })
      .finally(() => {
        if (!cancelled) setLoadingSummary(false)
      })

    return () => {
      cancelled = true
    }
  }, [period, fromDate, toDate, usingCustomRange, refreshToken])

  useEffect(() => {
    let cancelled = false
    setLoadingMovements(true)
    setMovementsError(rangeError)

    if (rangeError) {
      setLoadingMovements(false)
      return () => {
        cancelled = true
      }
    }

    financeApi
      .listMovements({
        ...rangeFilters,
        type: typeFilter === 'all' ? undefined : typeFilter,
        search: debouncedSearch
      })
      .then((data) => {
        if (!cancelled) setMovements(data)
      })
      .catch((error: unknown) => {
        if (!cancelled) setMovementsError(toMessage(error))
      })
      .finally(() => {
        if (!cancelled) setLoadingMovements(false)
      })

    return () => {
      cancelled = true
    }
  }, [period, fromDate, toDate, usingCustomRange, typeFilter, debouncedSearch, refreshToken])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 5000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const activeError = summaryError ?? movementsError
  const hasFilters = debouncedSearch.trim().length > 0 || typeFilter !== 'all'
  const periodLabel = PERIOD_OPTIONS.find((option) => option.id === period)?.label ?? 'Todo'

  function refresh(): void {
    setRefreshToken((value) => value + 1)
  }

  function handleSaved(message: string): void {
    setEditorOpen(false)
    setNotice({ tone: 'success', text: message })
    refresh()
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      await financeApi.deleteMovement(deleteTarget.id)
      setNotice({ tone: 'success', text: 'El movimiento fue eliminado de la caja.' })
      setDeleteTarget(null)
      refresh()
    } catch (error) {
      setNotice({ tone: 'error', text: toMessage(error) })
    } finally {
      setDeleting(false)
    }
  }

  function clearFilters(): void {
    setSearch('')
    setTypeFilter('all')
  }

  return (
    <WorkspaceShell
      title={module.title}
      subtitle={module.kicker}
      icon={module.icon}
      accent={module.accent}
      actions={
        <button
          type="button"
          className="primary-button"
          onClick={() => setEditorOpen(true)}
          disabled={!entitlements.features.finance.createManual}
          title={!entitlements.features.finance.createManual ? 'Deshabilitado por permisos' : undefined}
        >
          <Plus size={15} />
          Nuevo movimiento
        </button>
      }
    >
      <div className="finance-page">
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

        <div className="fin-period-bar">
          <div className="fin-periods" role="group" aria-label="Periodo financiero">
            {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={period === option.id && !usingCustomRange ? 'is-active' : undefined}
              aria-pressed={period === option.id && !usingCustomRange}
              onClick={() => {
                setFromDate('')
                setToDate('')
                setPeriod(option.id)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
          <span className="fin-period-note">
            {loadingSummary
              ? 'Actualizando resumen...'
              : usingCustomRange
                ? 'Mostrando: rango personalizado'
                : `Mostrando: ${periodLabel}`}
          </span>
        </div>

        {customRangeEnabled ? (
          <div
            className="fin-range-bar"
            style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}
          >
            <label style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span>Desde</span>
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) => setFromDate(event.target.value)}
                aria-invalid={Boolean(rangeError)}
              />
            </label>
            <label style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span>Hasta</span>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                aria-invalid={Boolean(rangeError)}
              />
            </label>
            {fromDate || toDate ? (
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setFromDate('')
                  setToDate('')
                }}
              >
                Limpiar rango
              </button>
            ) : (
              <span className="fin-period-note">Opcional: filtra un rango de fechas personalizado.</span>
            )}
            {rangeError ? <span className="field-error">{rangeError}</span> : null}
          </div>
        ) : null}

        <section className="fin-summary-grid" aria-label="Resumen financiero">
          <article className="fin-stat is-balance">
            <span className="fin-stat-icon">
              <Wallet size={18} />
            </span>
            <div className="inv-stat-body">
              <span className="inv-stat-label">Balance</span>
              <strong
                className={`inv-stat-value is-money${
                  summary && summary.balanceCents < 0 ? ' is-negative' : ''
                }`}
              >
                {summary
                  ? formatMoney(summary.balanceCents, business.locale, business.currency)
                  : '—'}
              </strong>
              <span className="inv-stat-foot">Ingresos menos egresos</span>
            </div>
          </article>

          <article className="fin-stat is-income">
            <span className="fin-stat-icon">
              <ArrowDown size={18} />
            </span>
            <div className="inv-stat-body">
              <span className="inv-stat-label">Ingresos</span>
              <strong className="inv-stat-value is-money">
                {summary
                  ? formatMoney(summary.incomeCents, business.locale, business.currency)
                  : '—'}
              </strong>
              <span className="inv-stat-foot">
                {summary ? `${formatNumber(summary.incomeCount, business.locale)} movimientos` : '—'}
              </span>
            </div>
          </article>

          <article className="fin-stat is-expense">
            <span className="fin-stat-icon">
              <ArrowUp size={18} />
            </span>
            <div className="inv-stat-body">
              <span className="inv-stat-label">Egresos</span>
              <strong className="inv-stat-value is-money">
                {summary
                  ? formatMoney(summary.expenseCents, business.locale, business.currency)
                  : '—'}
              </strong>
              <span className="inv-stat-foot">
                {summary
                  ? `${formatNumber(summary.expenseCount, business.locale)} movimientos`
                  : '—'}
              </span>
            </div>
          </article>

          <article className="fin-stat">
            <span className="fin-stat-icon">
              <List size={18} />
            </span>
            <div className="inv-stat-body">
              <span className="inv-stat-label">Movimientos</span>
              <strong className="inv-stat-value">
                {summary ? formatNumber(summary.movementCount, business.locale) : '—'}
              </strong>
              <span className="inv-stat-foot">En el periodo seleccionado</span>
            </div>
          </article>
        </section>

        {activeError ? (
          <div className="form-message error inv-error" role="alert">
            <AlertTriangle size={16} />
            <span>{activeError}</span>
            <button type="button" className="inv-retry" onClick={refresh}>
              Reintentar
            </button>
          </div>
        ) : null}

        <div className="fin-toolbar">
          <div className="inv-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value.replace(/[\x00-\x1F\x7F]/g, ' ').slice(0, 100))}
              placeholder="Buscar por concepto, categoría o producto"
              aria-label="Buscar movimientos financieros"
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

          <div className="fin-type-filter" role="group" aria-label="Filtrar por tipo">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={typeFilter === option.id ? 'is-active' : undefined}
                aria-pressed={typeFilter === option.id}
                onClick={() => setTypeFilter(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {loadingMovements && movements.length > 0 ? (
            <span className="inv-updating">Actualizando...</span>
          ) : null}
        </div>

        {loadingMovements && movements.length === 0 ? (
          <div className="inv-loading">
            <span className="spinner" />
            <p>Cargando movimientos...</p>
          </div>
        ) : movements.length > 0 ? (
          <div className="inv-table-wrap">
            <table className="inv-table fin-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Categoría</th>
                  <th>Origen</th>
                  <th>Tipo</th>
                  <th className="is-num">Monto</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="inv-date">
                      {formatDate(movement.occurredOn, business.locale)}
                    </td>
                    <td>
                      <div className="fin-concept">
                        <span className="fin-concept-name">{movement.concept}</span>
                        {movement.productName ? (
                          <span className="fin-concept-meta">
                            {movement.productName}
                            {movement.productSku ? ` · ${movement.productSku}` : ''}
                            {movement.quantity !== null ? ` · ${movement.quantity} u.` : ''}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <span className="inv-category">{movement.category || 'Sin categoría'}</span>
                    </td>
                    <td>
                      <span className={`fin-source is-${movement.source}`}>
                        {movement.source === 'sale' ? 'Venta' : 'Manual'}
                      </span>
                    </td>
                    <td>
                      <span className={`fin-type is-${movement.type}`}>
                        {movement.type === 'income' ? (
                          <ArrowDown size={12} />
                        ) : (
                          <ArrowUp size={12} />
                        )}
                        {movement.type === 'income' ? 'Ingreso' : 'Egreso'}
                      </span>
                    </td>
                    <td className={`is-num fin-amount is-${movement.type}`}>
                      {movement.type === 'income' ? '+' : '−'}
                      {formatMoney(movement.amountCents, business.locale, business.currency)}
                    </td>
                    <td>
                      {movement.source === 'manual' && entitlements.features.finance.deleteManual ? (
                        <div className="inv-row-actions">
                          <button
                            type="button"
                            className="icon-button is-danger"
                            title="Eliminar movimiento"
                            aria-label={`Eliminar ${movement.concept}`}
                            onClick={() => setDeleteTarget(movement)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ) : (
                        <span className="fin-locked" title={movement.source === 'manual' && !entitlements.features.finance.deleteManual ? 'Eliminación deshabilitada por permisos' : 'Los ingresos por venta no se eliminan aquí'}>
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : movementsError ? null : (
          <section className="inv-empty">
            <span className="fin-empty-icon">
              <Wallet size={24} />
            </span>
            <h2>{hasFilters ? 'Sin resultados' : 'Tu caja está vacía'}</h2>
            <p>
              {hasFilters
                ? 'No hay movimientos que coincidan con la búsqueda o los filtros aplicados.'
                : 'Registra tu primer ingreso o egreso para comenzar a controlar el flujo de caja.'}
            </p>
            {hasFilters ? (
              <button type="button" className="ghost-button" onClick={clearFilters}>
                Limpiar filtros
              </button>
            ) : (
              <button type="button" className="primary-button" onClick={() => setEditorOpen(true)}>
                <Plus size={15} />
                Registrar movimiento
              </button>
            )}
          </section>
        )}

        {editorOpen ? (
          <FinanceMovementModal
            currency={business.currency}
            locale={business.locale}
            onClose={() => setEditorOpen(false)}
            onSaved={handleSaved}
          />
        ) : null}

        {deleteTarget ? (
          <Modal
            title="Eliminar movimiento"
            subtitle={`${deleteTarget.concept} · ${formatMoney(
              deleteTarget.amountCents,
              business.locale,
              business.currency
            )}`}
            onClose={() => {
              if (!deleting) setDeleteTarget(null)
            }}
          >
            <p className="confirm-copy">
              Este movimiento se eliminará de la caja. La operación no modifica productos ni
              existencias del inventario.
            </p>
            <div className="form-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => void confirmDelete()}
                disabled={deleting}
              >
                <Trash2 size={15} />
                {deleting ? 'Eliminando...' : 'Eliminar movimiento'}
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
