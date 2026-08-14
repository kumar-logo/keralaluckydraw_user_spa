import { describe, it, expect } from 'vitest'
import { formatCurrency } from './format'

describe('formatCurrency — money display', () => {
  it('prefixes the rupee symbol with 2-decimal precision by default', () => {
    expect(formatCurrency(1234.5)).toBe('₹1,234.50')
  })

  it('groups thousands using the en-IN locale (lakh grouping)', () => {
    expect(formatCurrency(100000)).toBe('₹1,00,000.00')
  })

  it('honours an explicit precision argument', () => {
    expect(formatCurrency(1234.567, 0)).toBe('₹1,235')
  })

  it('accepts a numeric string amount', () => {
    expect(formatCurrency('250')).toBe('₹250.00')
  })

  it('coerces an illegal amount to 0 instead of NaN', () => {
    expect(formatCurrency('not-a-number')).toBe('₹0.00')
  })

  it('renders the minus sign before the symbol for negative amounts', () => {
    const out = formatCurrency(-500)
    expect(out.startsWith('-₹')).toBe(true)
    expect(out).toBe('-₹500.00')
  })

  it('trims trailing zeros when requested', () => {
    expect(formatCurrency(10.5, 2, true)).toBe('₹10.5')
    expect(formatCurrency(10, 2, true)).toBe('₹10')
  })

  it('hides the symbol via the options object form', () => {
    expect(formatCurrency({ amount: 1000, hideSymbol: true, precision: 0 })).toBe('1,000')
  })

  it('abbreviates large amounts via the options object form', () => {
    expect(formatCurrency({ amount: 2_500_000, abbreviate: true })).toBe('₹2M')
  })
})
