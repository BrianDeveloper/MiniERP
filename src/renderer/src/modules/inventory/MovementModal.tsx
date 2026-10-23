import { ArrowDown, ArrowRight, ArrowUp, Save } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Product, StockMovementType } from '../../../../shared/types/inventory'
import { ApiError } from '../../api/client'
import { financeApi } from '../../api/finance'
import { inventoryApi } from '../../api/inventory'
import { Modal } from '../../components/Modal'
import {
  centsToInput,
  formatMoney,
  formatNumber,
  parseIntegerInput,
  parseMoneyToCents,
  todayIsoDate
} from '../../lib/format'

interface MovementModalProps {
  products: Product[]
  initialProductId: string | null
  locale: string
  currency: string
  financeEnabled: boolean
  onClose: () => void
  onSaved: (message: string) => void
}

export function MovementModal({
  products,
  initialProductId,
  locale,
  currency,
  financeEnabled,
  onClose,
  onSaved
}: MovementModalProps) {
  const initialProduct = products.find((item) => item.id === initialProductId) ?? products[0]
  const [productId, setProductId] = useState(initialProduct?.id ?? '')
  const [type, setType] = useState<StockMovementType>('in')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [registerSale, setRegisterSale] = useState(false)
  const [unitPrice, setUnitPrice] = useState(
    initialProduct ? centsToInput(initialProduct.salePriceCents) : ''
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const product = products.find((item) => item.id === productId)
  const parsedQuantity = parseIntegerInput(quantity)
  const parsedUnitPrice = parseMoneyToCents(unitPrice)
  const resultingStock =
    product && parsedQuantity !== null
      ? type === 'in'
        ? product.stockCurrent + parsedQuantity
        : product.stockCurrent - parsedQuantity
      : null
  const canRegisterSale = financeEnabled && type === 'out'
  const isSale = canRegisterSale && registerSale
  const saleTotalCents =
    parsedQuantity !== null && parsedUnitPrice !== null ? parsedQuantity * parsedUnitPrice : null

  function handleClose(): void {
    if (!saving) onClose()
  }

  function clearError(field: string): void {
    setFieldErrors((previous) => {
      if (!(field in previous)) return previous
      const next = { ...previous }
      delete next[field]
      return next
    })
    setFormError('')
  }

  function changeType(next: StockMovementType): void {
    setType(next)
    if (next === 'in') setRegisterSale(false)
    setFieldErrors({})
    setFormError('')
  }

  function changeProduct(nextId: string): void {
    setProductId(nextId)
    const nextProduct = products.find((item) => item.id === nextId)
    if (nextProduct) setUnitPrice(centsToInput(nextProduct.salePriceCents))
    setFieldErrors({})
    setFormError('')
  }

  function changeRegisterSale(checked: boolean): void {
    setRegisterSale(checked)
    if (checked && product) setUnitPrice(centsToInput(product.salePriceCents))
    setFieldErrors({})
    setFormError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (saving) return

    const errors: Record<string, string> = {}

    if (!product) errors.productId = 'Selecciona un producto.'
    if (parsedQuantity === null || parsedQuantity < 1) {
      errors.quantity = 'Ingresa una cantidad entera mayor que cero.'
    } else if (product && type === 'out' && parsedQuantity > product.stockCurrent) {
      errors.quantity = `Solo hay ${product.stockCurrent} unidades disponibles.`
    }
    if (isSale && (parsedUnitPrice === null || parsedUnitPrice < 1)) {
      errors.unitPriceCents = 'Ingresa un precio unitario mayor que cero.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setFormError('Revisa los campos marcados.')
      return
    }

    setSaving(true)
    setFormError('')
    setFieldErrors({})

    try {
      if (isSale) {
        await financeApi.createSale({
          occurredOn: todayIsoDate(),
          productId,
          quantity: parsedQuantity as number,
          unitPriceCents: parsedUnitPrice as number,
          note: note.trim()
        })
        onSaved(
          `Salida registrada y venta ingresada por ${formatMoney(
            saleTotalCents as number,
            locale,
            currency
          )}.`
        )
        return
      }

      await inventoryApi.createMovement({
        productId,
        type,
        quantity: parsedQuantity as number,
        note: note.trim()
      })
      onSaved(
        `${type === 'in' ? 'Entrada' : 'Salida'} registrada para "${product?.name ?? 'producto'}".`
      )
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fields ?? {})
        setFormError(error.message)
      } else {
        setFormError('No se pudo registrar el movimiento.')
      }
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isSale ? 'Registrar venta' : 'Registrar movimiento'}
      subtitle={
        isSale
          ? 'La salida del inventario y el ingreso financiero se guardan juntos.'
          : 'Las entradas y salidas actualizan el stock y quedan en el historial.'
      }
      onClose={handleClose}
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className="form-grid">
          <div className="field field-full">
            <label htmlFor="movement-product">Producto</label>
            <select
              id="movement-product"
              value={productId}
              onChange={(event) => changeProduct(event.target.value)}
              disabled={products.length === 0}
              aria-invalid={Boolean(fieldErrors.productId)}
            >
              {products.length === 0 ? <option value="">Sin productos disponibles</option> : null}
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.sku}
                </option>
              ))}
            </select>
            {fieldErrors.productId ? (
              <span className="field-error">{fieldErrors.productId}</span>
            ) : null}
          </div>

          <div className="field field-full">
            <span className="field-label">Tipo de movimiento</span>
            <div className="movement-toggle" role="group" aria-label="Tipo de movimiento">
              <button
                type="button"
                className={`movement-type${type === 'in' ? ' is-active' : ''}`}
                onClick={() => changeType('in')}
                aria-pressed={type === 'in'}
              >
                <ArrowDown size={15} />
                Entrada
              </button>
              <button
                type="button"
                className={`movement-type is-out${type === 'out' ? ' is-active' : ''}`}
                onClick={() => changeType('out')}
                aria-pressed={type === 'out'}
              >
                <ArrowUp size={15} />
                Salida
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="movement-quantity">Cantidad</label>
            <input
              id="movement-quantity"
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value)
                clearError('quantity')
              }}
              placeholder="0"
              inputMode="numeric"
              autoFocus
              aria-invalid={Boolean(fieldErrors.quantity)}
            />
            {fieldErrors.quantity ? (
              <span className="field-error">{fieldErrors.quantity}</span>
            ) : null}
          </div>

          {isSale ? (
            <div className="field">
              <label htmlFor="movement-unit-price">Precio unitario ({currency})</label>
              <input
                id="movement-unit-price"
                value={unitPrice}
                onChange={(event) => {
                  setUnitPrice(event.target.value)
                  clearError('unitPriceCents')
                }}
                placeholder="0,00"
                inputMode="decimal"
                aria-invalid={Boolean(fieldErrors.unitPriceCents)}
              />
              {fieldErrors.unitPriceCents ? (
                <span className="field-error">{fieldErrors.unitPriceCents}</span>
              ) : null}
            </div>
          ) : null}

          <div className={`field${isSale ? ' field-full' : ''}`}>
            <label htmlFor="movement-note">Nota (opcional)</label>
            <input
              id="movement-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={isSale ? 'Ej. Venta de mostrador' : 'Ej. Compra a proveedor'}
              maxLength={200}
            />
          </div>

          {canRegisterSale ? (
            <label className="fin-sale-toggle field-full">
              <input
                type="checkbox"
                checked={registerSale}
                onChange={(event) => changeRegisterSale(event.target.checked)}
              />
              <span>
                <strong>Registrar como venta</strong>
                <small>Suma el total como ingreso en Finanzas y vincula ambos movimientos.</small>
              </span>
            </label>
          ) : null}

          {isSale ? (
            <div className="fin-sale-total field-full">
              <span>Total de la venta</span>
              <strong>
                {saleTotalCents !== null
                  ? formatMoney(saleTotalCents, locale, currency)
                  : '—'}
              </strong>
            </div>
          ) : null}

          <div className="movement-preview field-full">
            <div>
              <span>Stock actual</span>
              <strong>{product ? formatNumber(product.stockCurrent, locale) : '—'}</strong>
            </div>
            <ArrowRight size={16} />
            <div>
              <span>Stock resultante</span>
              <strong className={resultingStock !== null && resultingStock < 0 ? 'is-negative' : ''}>
                {resultingStock !== null ? formatNumber(resultingStock, locale) : '—'}
              </strong>
            </div>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="form-message error" role="alert">
            Primero crea un producto para registrar movimientos.
          </div>
        ) : null}

        {formError ? (
          <div className="form-message error" role="alert">
            {formError}
          </div>
        ) : null}

        <div className="form-actions">
          <button type="button" className="ghost-button" onClick={handleClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={saving || products.length === 0}
          >
            <Save size={15} />
            {saving ? 'Registrando...' : isSale ? 'Registrar venta' : 'Registrar movimiento'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
