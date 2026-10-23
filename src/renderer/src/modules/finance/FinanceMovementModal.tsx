import { ArrowDown, ArrowUp, Save } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { FinancialMovementType } from '../../../../shared/types/finance'
import { ApiError } from '../../api/client'
import { financeApi } from '../../api/finance'
import { Modal } from '../../components/Modal'
import { formatMoney, parseMoneyToCents, todayIsoDate } from '../../lib/format'
import { financeMovementSchema } from '../../../../shared/validation/schemas'
import { formatMoneyInput, MAX_CONCEPT_LENGTH } from '../../../../shared/validation/rules'

interface FinanceMovementModalProps {
  currency: string
  locale: string
  onClose: () => void
  onSaved: (message: string) => void
}

export function FinanceMovementModal({
  currency,
  locale,
  onClose,
  onSaved
}: FinanceMovementModalProps) {
  const [occurredOn, setOccurredOn] = useState(todayIsoDate)
  const [type, setType] = useState<FinancialMovementType>('income')
  const [amount, setAmount] = useState('')
  const [concept, setConcept] = useState('')
  const [category, setCategory] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const amountCents = parseMoneyToCents(amount)

  function handleClose(): void {
    if (!saving) onClose()
  }

  function changeType(next: FinancialMovementType): void {
    setType(next)
    setFieldErrors({})
    setFormError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (saving) return

    const errors: Record<string, string> = {}
    const cleanConcept = concept.trim()
    const cleanCategory = category.trim()

    const parsed = financeMovementSchema.safeParse({
      occurredOn,
      type,
      amountCents,
      concept: cleanConcept,
      category: cleanCategory
    })

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path[0]
        if (typeof path === 'string') {
          if (path === 'amountCents') errors.amountCents = issue.message
          else errors[path] = issue.message
        }
      }
    }

    if (amountCents === null || amountCents <= 0) {
      errors.amountCents = errors.amountCents ?? 'Ingresa un monto mayor a cero.'
    }
    if (!occurredOn) errors.occurredOn = 'Selecciona una fecha.'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setFormError('Revisa los campos marcados.')
      return
    }

    setSaving(true)
    setFormError('')
    setFieldErrors({})

    try {
      await financeApi.createMovement({
        occurredOn,
        type,
        amountCents: amountCents as number,
        concept: cleanConcept,
        category: cleanCategory
      })
      onSaved(
        `${type === 'income' ? 'Ingreso' : 'Egreso'} de ${formatMoney(
          amountCents as number,
          locale,
          currency
        )} registrado.`
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
      title="Nuevo movimiento de caja"
      subtitle="Registra un ingreso o egreso manual para llevar el control financiero."
      onClose={handleClose}
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate autoComplete="off">
        <div className="form-grid">
          <div className="field">
            <label htmlFor="finance-date">Fecha</label>
            <input
              id="finance-date"
              type="date"
              value={occurredOn}
              onChange={(event) => {
                setOccurredOn(event.target.value)
                setFieldErrors({})
                setFormError('')
              }}
              aria-invalid={Boolean(fieldErrors.occurredOn)}
            />
            {fieldErrors.occurredOn ? (
              <span className="field-error">{fieldErrors.occurredOn}</span>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="finance-amount">Monto ({currency})</label>
            <input
              id="finance-amount"
              value={amount}
              onChange={(event) => {
                setAmount(formatMoneyInput(event.target.value))
                setFieldErrors({})
                setFormError('')
              }}
              placeholder="0,00"
              inputMode="decimal"
              autoFocus
              aria-invalid={Boolean(fieldErrors.amountCents)}
            />
            {fieldErrors.amountCents ? (
              <span className="field-error">{fieldErrors.amountCents}</span>
            ) : null}
          </div>

          <div className="field field-full">
            <span className="field-label">Tipo de movimiento</span>
            <div className="movement-toggle" role="group" aria-label="Tipo de movimiento">
              <button
                type="button"
                className={`movement-type${type === 'income' ? ' is-active' : ''}`}
                onClick={() => changeType('income')}
                aria-pressed={type === 'income'}
              >
                <ArrowDown size={15} />
                Ingreso
              </button>
              <button
                type="button"
                className={`movement-type is-out${type === 'expense' ? ' is-active' : ''}`}
                onClick={() => changeType('expense')}
                aria-pressed={type === 'expense'}
              >
                <ArrowUp size={15} />
                Egreso
              </button>
            </div>
          </div>

          <div className="field field-full">
            <label htmlFor="finance-concept">Concepto</label>
            <input
              id="finance-concept"
              value={concept}
              onChange={(event) => {
                setConcept(event.target.value)
                setFieldErrors({})
                setFormError('')
              }}
              placeholder="Ej. Pago de alquiler"
              maxLength={MAX_CONCEPT_LENGTH}
              aria-invalid={Boolean(fieldErrors.concept)}
            />
            {fieldErrors.concept ? (
              <span className="field-error">{fieldErrors.concept}</span>
            ) : null}
          </div>

          <div className="field field-full">
            <label htmlFor="finance-category">Categoría (opcional)</label>
            <select
              id="finance-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-invalid={Boolean(fieldErrors.category)}
            >
              <option value="">Sin categoría</option>
              <option value="Ventas">Ventas</option>
              <option value="Alquiler">Alquiler</option>
              <option value="Servicios">Servicios</option>
              <option value="Transporte">Transporte</option>
              <option value="Compras">Compras</option>
              <option value="Nómina">Nómina</option>
              <option value="Impuestos">Impuestos</option>
              <option value="Varios">Varios</option>
            </select>
            {fieldErrors.category ? (
              <span className="field-error">{fieldErrors.category}</span>
            ) : null}
          </div>
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
            {saving ? 'Registrando...' : 'Registrar movimiento'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
