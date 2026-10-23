import { Info, Save } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Product } from '../../../../shared/types/inventory'
import { ApiError } from '../../api/client'
import { inventoryApi } from '../../api/inventory'
import { Modal } from '../../components/Modal'
import { centsToInput, parseIntegerInput, parseMoneyToCents } from '../../lib/format'
import { productFormSchema } from '../../../../shared/validation/schemas'
import {
  formatIntegerInputValue,
  formatMoneyInput,
  formatSkuInput,
  MAX_PRODUCT_NAME,
  MAX_SKU_LENGTH,
  MAX_STOCK_DIGITS
} from '../../../../shared/validation/rules'

interface ProductFormModalProps {
  product: Product | null
  currency: string
  onClose: () => void
  onSaved: (message: string) => void
}

interface FormState {
  sku: string
  name: string
  category: string
  costPrice: string
  salePrice: string
  stockMinimum: string
  initialStock: string
}

type FieldKey =
  | 'sku'
  | 'name'
  | 'category'
  | 'costPriceCents'
  | 'salePriceCents'
  | 'stockMinimum'
  | 'initialStock'

export function ProductFormModal({
  product,
  currency,
  onClose,
  onSaved
}: ProductFormModalProps) {
  const [form, setForm] = useState<FormState>(() => ({
    sku: product?.sku ?? '',
    name: product?.name ?? '',
    category: product?.category ?? '',
    costPrice: product ? centsToInput(product.costPriceCents) : '',
    salePrice: product ? centsToInput(product.salePriceCents) : '',
    stockMinimum: product ? String(product.stockMinimum) : '0',
    initialStock: '0'
  }))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const isEdit = Boolean(product)

  function updateField(field: keyof FormState, value: string): void {
    let nextValue = value
    if (field === 'sku') nextValue = formatSkuInput(value)
    if (field === 'costPrice') nextValue = formatMoneyInput(value)
    if (field === 'salePrice') nextValue = formatMoneyInput(value)
    if (field === 'stockMinimum') nextValue = formatIntegerInputValue(value)
    if (field === 'initialStock') nextValue = formatIntegerInputValue(value)

    setForm((previous) => ({ ...previous, [field]: nextValue }))
    setFormError('')

    const errorKey = field === 'costPrice' ? 'costPriceCents' : field === 'salePrice' ? 'salePriceCents' : field
    setFieldErrors((previous) => {
      if (!(errorKey in previous)) return previous
      const next = { ...previous }
      delete next[errorKey]
      return next
    })
  }

  function handleClose(): void {
    if (!saving) onClose()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (saving) return

    const errors: Record<string, string> = {}
    const sku = form.sku.trim()
    const name = form.name.trim()
    const category = form.category.trim()
    const costPriceCents = parseMoneyToCents(form.costPrice)
    const salePriceCents = parseMoneyToCents(form.salePrice)
    const stockMinimum = parseIntegerInput(form.stockMinimum)
    const initialStock = parseIntegerInput(form.initialStock)

    const parsed = productFormSchema.safeParse({
      sku,
      name,
      category,
      costPriceCents,
      salePriceCents,
      stockMinimum,
      initialStock: isEdit ? undefined : initialStock
    })

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path[0]
        if (typeof path === 'string') {
          if (path === 'costPriceCents') errors.costPriceCents = issue.message
          else if (path === 'salePriceCents') errors.salePriceCents = issue.message
          else if (path === 'initialStock') errors.initialStock = issue.message
          else errors[path] = issue.message
        }
      }
    }

    if (!isEdit && initialStock === null) errors.initialStock = 'Ingresa un stock inicial válido.'
    if (stockMinimum === null) errors.stockMinimum = 'Ingresa a stock mínimo válido.'
    if (costPriceCents === null) errors.costPriceCents = errors.costPriceCents ?? 'Ingresa un costo válido.'
    if (salePriceCents === null) errors.salePriceCents = errors.salePriceCents ?? 'Ingresa un precio válido.'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setFormError('Revisa los campos marcados.')
      return
    }

    if (parsed.success && parsed.data.salePriceCents < parsed.data.costPriceCents) {
      setFieldErrors((previous) => ({
        ...previous,
        salePriceCents: previous.salePriceCents ?? 'Advertencia: el precio de venta es menor al precio de costo.'
      }))
    }

    setSaving(true)
    setFormError('')
    setFieldErrors({})

    const base = {
      sku,
      name,
      category,
      costPriceCents: (parsed.success ? parsed.data.costPriceCents : costPriceCents) as number,
      salePriceCents: (parsed.success ? parsed.data.salePriceCents : salePriceCents) as number,
      stockMinimum: (parsed.success ? parsed.data.stockMinimum : stockMinimum) as number
    }

    try {
      if (product) {
        await inventoryApi.updateProduct(product.id, base)
        onSaved(`"${name}" se actualizó correctamente.`)
      } else {
        await inventoryApi.createProduct({ ...base, initialStock: initialStock as number })
        onSaved(`"${name}" se agregó al inventario.`)
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fields ?? {})
        setFormError(error.message)
      } else {
        setFormError('No se pudo guardar el producto.')
      }
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
      subtitle={
        isEdit
          ? 'Actualiza los datos del catálogo. El stock se modificará con movimientos.'
          : 'Registra un producto y su existencia inicial.'
      }
      onClose={handleClose}
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate autoComplete="off">
        <div className="form-grid">
          <div className="field">
            <label htmlFor="product-sku">SKU</label>
            <input
              id="product-sku"
              value={form.sku}
              onChange={(event) => updateField('sku', event.target.value)}
              placeholder="Ej. CAF-001"
              autoFocus
              maxLength={MAX_SKU_LENGTH}
              aria-invalid={Boolean(fieldErrors.sku)}
            />
            {fieldErrors.sku ? <span className="field-error">{fieldErrors.sku}</span> : null}
          </div>

          <div className="field">
            <label htmlFor="product-category">Categoría</label>
            <input
              id="product-category"
              value={form.category}
              onChange={(event) => updateField('category', event.target.value)}
              placeholder="Ej. Bebidas"
              aria-invalid={Boolean(fieldErrors.category)}
            />
            {fieldErrors.category ? (
              <span className="field-error">{fieldErrors.category}</span>
            ) : null}
          </div>

          <div className="field field-full">
            <label htmlFor="product-name">Nombre del producto</label>
            <input
              id="product-name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Ej. Café molido 500 g"
              maxLength={MAX_PRODUCT_NAME}
              aria-invalid={Boolean(fieldErrors.name)}
            />
            {fieldErrors.name ? <span className="field-error">{fieldErrors.name}</span> : null}
          </div>

          <div className="field">
            <label htmlFor="product-cost">Precio de costo ({currency})</label>
            <input
              id="product-cost"
              value={form.costPrice}
              onChange={(event) => updateField('costPrice', event.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              aria-invalid={Boolean(fieldErrors.costPriceCents)}
            />
            {fieldErrors.costPriceCents ? (
              <span className="field-error">{fieldErrors.costPriceCents}</span>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="product-sale">Precio de venta ({currency})</label>
            <input
              id="product-sale"
              value={form.salePrice}
              onChange={(event) => updateField('salePrice', event.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              aria-invalid={Boolean(fieldErrors.salePriceCents)}
            />
            {fieldErrors.salePriceCents ? (
              <span className="field-error">{fieldErrors.salePriceCents}</span>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="product-minimum">Stock mínimo</label>
            <input
              id="product-minimum"
              value={form.stockMinimum}
              onChange={(event) => updateField('stockMinimum', event.target.value)}
              placeholder="0"
              inputMode="numeric"
              maxLength={MAX_STOCK_DIGITS}
              aria-invalid={Boolean(fieldErrors.stockMinimum)}
            />
            <span className="field-hint">Se avisará cuando el stock llegue a este nivel.</span>
            {fieldErrors.stockMinimum ? (
              <span className="field-error">{fieldErrors.stockMinimum}</span>
            ) : null}
          </div>

          {isEdit && product ? (
            <div className="field">
              <span className="field-label">Stock actual</span>
              <div className="inv-current-stock">
                <strong>{product.stockCurrent}</strong>
                <span>unidades</span>
              </div>
              <span className="field-hint">Se ajusta registrando entradas o salidas.</span>
            </div>
          ) : (
            <div className="field">
              <label htmlFor="product-initial">Stock inicial</label>
              <input
                id="product-initial"
                value={form.initialStock}
                onChange={(event) => updateField('initialStock', event.target.value)}
                placeholder="0"
                inputMode="numeric"
                maxLength={MAX_STOCK_DIGITS}
                aria-invalid={Boolean(fieldErrors.initialStock)}
              />
              <span className="field-hint">Se registrará como una entrada de inventario.</span>
              {fieldErrors.initialStock ? (
                <span className="field-error">{fieldErrors.initialStock}</span>
              ) : null}
            </div>
          )}

          {isEdit ? (
            <div className="inv-stock-note field-full">
              <Info size={15} />
              <span>
                Para corregir existencias utiliza una entrada o salida. Así se conserva el
                historial completo del producto.
              </span>
            </div>
          ) : null}
        </div>

        {formError ? (
          <div className="form-message error" role="alert">
            {formError}
          </div>
        ) : null}

        <div className="form-actions">
          <button type="button" className="ghost-button" onClick={handleClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="primary-button" disabled={saving}>
            <Save size={15} />
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
