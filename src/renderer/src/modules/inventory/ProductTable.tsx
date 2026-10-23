import { AlertTriangle, Archive, ArrowLeftRight, Check, Pencil } from 'lucide-react'
import type { Product } from '../../../../shared/types/inventory'
import { formatMoney } from '../../lib/format'

interface ProductTableProps {
  products: Product[]
  locale: string
  currency: string
  onEdit: (product: Product) => void
  onMovement: (product: Product) => void
  onArchive: (product: Product) => void
}

export function ProductTable({
  products,
  locale,
  currency,
  onEdit,
  onMovement,
  onArchive
}: ProductTableProps) {
  return (
    <div className="inv-table-wrap">
      <table className="inv-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th className="is-num">Costo</th>
            <th className="is-num">Precio</th>
            <th className="is-num">Stock</th>
            <th>Estado</th>
            <th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className={product.lowStock ? 'is-low' : undefined}>
              <td>
                <div className="inv-product-cell">
                  <span className="inv-product-name">{product.name}</span>
                  <span className="inv-product-sku">{product.sku}</span>
                </div>
              </td>
              <td>
                <span className="inv-category">{product.category || 'Sin categoría'}</span>
              </td>
              <td className="is-num">{formatMoney(product.costPriceCents, locale, currency)}</td>
              <td className="is-num">{formatMoney(product.salePriceCents, locale, currency)}</td>
              <td className="is-num">
                <div className={`inv-stock${product.lowStock ? ' is-low' : ''}`}>
                  <strong>{product.stockCurrent}</strong>
                  <span>mín. {product.stockMinimum}</span>
                </div>
              </td>
              <td>
                {product.lowStock ? (
                  <span className="inv-status is-low">
                    <AlertTriangle size={13} />
                    Stock bajo
                  </span>
                ) : (
                  <span className="inv-status is-ok">
                    <Check size={13} />
                    Disponible
                  </span>
                )}
              </td>
              <td>
                <div className="inv-row-actions">
                  <button
                    type="button"
                    className="icon-button"
                    title="Editar producto"
                    aria-label={`Editar ${product.name}`}
                    onClick={() => onEdit(product)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    title="Registrar movimiento"
                    aria-label={`Registrar movimiento de ${product.name}`}
                    onClick={() => onMovement(product)}
                  >
                    <ArrowLeftRight size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-button is-danger"
                    title="Archivar producto"
                    aria-label={`Archivar ${product.name}`}
                    onClick={() => onArchive(product)}
                  >
                    <Archive size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
