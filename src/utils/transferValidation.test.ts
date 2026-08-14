import { describe, it, expect } from 'vitest'
import { evaluateTransfer } from './transferValidation'

const LIMITS = { withdrawableBalance: 1000, minAmount: 300, maxAmount: 50000 }

describe('evaluateTransfer — /transfer button enable/disable', () => {
  it('disables (no error) when nothing is entered', () => {
    const r = evaluateTransfer('', LIMITS)
    expect(r.isValid).toBe(false)
    expect(r.errorKey).toBe('')
  })

  it('enables on a valid amount within balance and min/max', () => {
    const r = evaluateTransfer('500', LIMITS)
    expect(r.isValid).toBe(true)
    expect(r.errorKey).toBe('')
  })

  it('enables on the exact minimum amount', () => {
    expect(evaluateTransfer('300', LIMITS).isValid).toBe(true)
  })

  it('enables on the exact transferable ceiling (balance below maxAmount)', () => {
    expect(evaluateTransfer('1000', LIMITS).isValid).toBe(true)
  })

  it('disables below the minimum with a belowMin hint', () => {
    const r = evaluateTransfer('200', LIMITS)
    expect(r.isValid).toBe(false)
    expect(r.errorKey).toBe('recharge.transfer.action.belowMin')
  })

  it('disables over the available balance with an overMax hint', () => {
    const r = evaluateTransfer('1001', LIMITS)
    expect(r.isValid).toBe(false)
    expect(r.errorKey).toBe('recharge.transfer.action.overMax')
  })

  it('caps the ceiling at maxAmount when balance exceeds it', () => {
    const r = evaluateTransfer('50001', { withdrawableBalance: 99999, minAmount: 300, maxAmount: 50000 })
    expect(r.maxTransferable).toBe(50000)
    expect(r.isValid).toBe(false)
    expect(r.errorKey).toBe('recharge.transfer.action.overMax')
  })

  it('ROOT CAUSE: zero bonus balance keeps the button disabled with an insufficient hint', () => {
    const r = evaluateTransfer('300', { withdrawableBalance: 0, minAmount: 300, maxAmount: 50000 })
    expect(r.isValid).toBe(false)
    expect(r.errorKey).toBe('recharge.transfer.action.insufficient')
    expect(r.maxTransferable).toBe(0)
  })

  it('balance below the minimum is flagged insufficient (cannot ever be valid)', () => {
    const r = evaluateTransfer('100', { withdrawableBalance: 100, minAmount: 300, maxAmount: 50000 })
    expect(r.hasEnoughBalance).toBe(false)
    expect(r.isValid).toBe(false)
    expect(r.errorKey).toBe('recharge.transfer.action.insufficient')
  })

  it('rejects non-numeric input without enabling the button', () => {
    const r = evaluateTransfer('abc', LIMITS)
    expect(r.isValid).toBe(false)
  })

  it('rejects zero and negative amounts', () => {
    expect(evaluateTransfer('0', LIMITS).isValid).toBe(false)
    expect(evaluateTransfer('-50', LIMITS).isValid).toBe(false)
  })
})
