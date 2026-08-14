import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('i18next', () => ({
  default: { t: (key: string) => key },
}))

vi.mock('./toast', () => ({
  toast: { warning: vi.fn(), success: vi.fn(), show: vi.fn(), close: vi.fn() },
}))

import { checkInsufficientBalance } from './balanceCheck'
import { useAuthStore } from '../stores/authStore'
import { toast } from './toast'

describe('checkInsufficientBalance — bet money-path guard', () => {
  beforeEach(() => {
    useAuthStore.setState({ balance: 0, bonusBalance: 0 })
  })

  it('returns false (allows the bet) when main balance covers the amount', () => {
    useAuthStore.setState({ balance: 500 })
    expect(checkInsufficientBalance(200, 'three_digit_604')).toBe(false)
  })

  it('blocks the bet and opens the recharge drawer when main balance is short', () => {
    useAuthStore.setState({ balance: 100 })
    const listener = vi.fn()
    window.addEventListener('openRechargeDraw', listener)

    const blocked = checkInsufficientBalance(200, 'three_digit_604')

    expect(blocked).toBe(true)
    expect(listener).toHaveBeenCalledTimes(1)
    const detail = (listener.mock.calls[0][0] as CustomEvent).detail
    expect(detail.origin).toBe('bet_three_digit_604_insufficient_balance')
    window.removeEventListener('openRechargeDraw', listener)
  })

  it('blocks the bonus-wallet bet and warns when bonus balance is short', () => {
    useAuthStore.setState({ bonusBalance: 50 })
    const blocked = checkInsufficientBalance(200, 'three_digit_604', true)
    expect(blocked).toBe(true)
    expect(toast.warning).toHaveBeenCalledWith('common.tip.info.bonusNotEnought')
  })

  it('allows the bonus-wallet bet when bonus balance covers the amount', () => {
    useAuthStore.setState({ bonusBalance: 500 })
    expect(checkInsufficientBalance(200, 'three_digit_604', true)).toBe(false)
  })

  it('returns false for a NaN amount (defensive, never charges)', () => {
    useAuthStore.setState({ balance: 0 })
    expect(checkInsufficientBalance(NaN, 'three_digit_604')).toBe(false)
  })
})
