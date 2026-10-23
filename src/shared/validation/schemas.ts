import { z } from 'zod'
import {
  MAX_CATEGORY_LENGTH,
  MAX_CONCEPT_LENGTH,
  MAX_FINANCE_CATEGORY,
  MAX_PHONE_LENGTH,
  MAX_PRODUCT_NAME,
  MAX_RIF_LENGTH,
  MAX_SKU_LENGTH,
  MAX_STOCK_DIGITS,
  MIN_PRODUCT_NAME,
  RIF_REGEX,
  SKU_REGEX
} from './rules'

export const businessFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del negocio es obligatorio.').max(80, 'Máximo 80 caracteres.'),
  rif: z
    .string()
    .trim()
    .max(MAX_RIF_LENGTH, 'Máximo 15 caracteres.')
    .refine((val) => val === '' || RIF_REGEX.test(val), 'RIF/Cédula inválido. Formato: J-12345678-9 o V-12345678'),
  currency: z.string().min(1, 'Moneda obligatoria.'),
  address: z.string().trim().max(160, 'Máximo 160 caracteres.'),
  phone: z
    .string()
    .trim()
    .max(MAX_PHONE_LENGTH, 'Máximo 12 dígitos/caracteres.')
    .refine((val) => val === '' || /^[0-9+\-\s()]+$/.test(val), 'Teléfono con formato inválido.')
})

export const productFormSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(1, 'El SKU es obligatorio.')
      .max(MAX_SKU_LENGTH, 'Máximo 20 caracteres.')
      .regex(SKU_REGEX, 'SKU sin espacios, solo alfanuméricos, ., - o _.'),
    name: z
      .string()
      .trim()
      .min(MIN_PRODUCT_NAME, `Mínimo ${MIN_PRODUCT_NAME} caracteres.`)
      .max(MAX_PRODUCT_NAME, `Máximo ${MAX_PRODUCT_NAME} caracteres.`),
    category: z.string().trim().max(MAX_CATEGORY_LENGTH, `Máximo ${MAX_CATEGORY_LENGTH} caracteres.`),
    costPriceCents: z
      .number()
      .int('Debe ser entero en centavos.')
      .min(0, 'No puede ser negativo.'),
    salePriceCents: z
      .number()
      .int('Debe ser entero en centavos.')
      .min(0, 'No puede ser negativo.'),
    stockMinimum: z
      .number()
      .int('Debe ser entero.')
      .min(0, 'No puede ser negativo.')
      .max(Number('9'.repeat(MAX_STOCK_DIGITS)), `Máximo ${Number('9'.repeat(MAX_STOCK_DIGITS))}.`),
    initialStock: z
      .number()
      .int('Debe ser entero.')
      .min(0, 'No puede ser negativo.')
      .max(Number('9'.repeat(MAX_STOCK_DIGITS)), `Máximo ${Number('9'.repeat(MAX_STOCK_DIGITS))}.`)
      .optional()
  })
  .refine((data) => data.salePriceCents >= data.costPriceCents, {
    message: 'El precio de venta es menor al precio de costo.',
    path: ['salePriceCents']
  })

export type BusinessFormInput = z.infer<typeof businessFormSchema>
export type ProductFormInput = z.infer<typeof productFormSchema>

export const financeMovementSchema = z.object({
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.'),
  type: z.enum(['income', 'expense']),
  amountCents: z
    .number()
    .int('Monto debe estar en centavos.')
    .min(1, 'El monto debe ser mayor a 0.'),
  concept: z
    .string()
    .trim()
    .min(5, 'Mínimo 5 caracteres.')
    .max(MAX_CONCEPT_LENGTH, `Máximo ${MAX_CONCEPT_LENGTH} caracteres.`),
  category: z
    .string()
    .trim()
    .max(MAX_FINANCE_CATEGORY, `Máximo ${MAX_FINANCE_CATEGORY} caracteres.`)
})

export type FinanceMovementInput = z.infer<typeof financeMovementSchema>
