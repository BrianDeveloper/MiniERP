import { ArrowLeftRight } from 'lucide-react'
import type { StockMovement } from '../../../../shared/types/inventory'
import { formatDateTime } from '../../lib/format'

interface MovementHistoryProps {
  movements: StockMovement[]
  loading: boolean
  locale: string
}

export function MovementHistory({ movements, loading, locale }: MovementHistoryProps) {
  if (loading && movements.length === 0) {
    return (
      <div className="inv-loading">
        <span className="spinner" />
        <p>Cargando movimientos...</p>
      </div>
    )
  }

  if (movements.length === 0) {
    return (
      <section className="inv-empty">
        <span className="inv-empty-icon">
          <ArrowLeftRight size={24} />
        </span>
        <h2>Aún no hay movimientos</h2>
        <p>Las entradas y salidas de tus productos aparecerán aquí con su historial completo.</p>
      </section>
    )
  }

  return (
    <div className="inv-table-wrap">
      <table className="inv-table inv-movement-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Producto</th>
            <th>Tipo</th>
            <th className="is-num">Cantidad</th>
            <th className="is-num">Stock</th>
            <th>Nota</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => (
            <tr key={movement.id}>
              <td className="inv-date">{formatDateTime(movement.createdAt, locale)}</td>
              <td>
                <div className="inv-product-cell">
                  <span className="inv-product-name">{movement.productName}</span>
                  <span className="inv-product-sku">{movement.productSku}</span>
                </div>
              </td>
              <td>
                <span className={`inv-move-type is-${movement.type}`}>
                  {movement.type === 'in' ? 'Entrada' : 'Salida'}
                </span>
              </td>
              <td className={`is-num inv-quantity is-${movement.type}`}>
                {movement.type === 'in' ? '+' : '−'}
                {movement.quantity}
              </td>
              <td className="is-num inv-stock-flow">
                {movement.stockBefore} → <strong>{movement.stockAfter}</strong>
              </td>
              <td className="inv-note">{movement.note || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
