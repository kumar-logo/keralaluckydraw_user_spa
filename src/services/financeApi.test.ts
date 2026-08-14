import { describe, it, expect, beforeEach, vi } from 'vitest'

const { post, apiPost } = vi.hoisted(() => ({
  post: vi.fn(),
  apiPost: vi.fn(),
}))

vi.mock('./api', () => ({
  default: { post },
  apiPost: (...args: unknown[]) => apiPost(...args),
}))

import {
  withdrawBalance,
  transferBalance,
  rechargeBalance,
  claimVipAward,
} from './financeApi'

describe('financeApi — withdraw flow', () => {
  beforeEach(() => {
    post.mockResolvedValue({})
    apiPost.mockResolvedValue({})
  })

  it('posts the bank card id and amount to the withdraw endpoint', async () => {
    await withdrawBalance(7, 1500)
    expect(post).toHaveBeenCalledWith('/hall/api/finance/v1/wd/balance', {
      bankcardId: 7,
      amount: 1500,
    })
  })
})

describe('financeApi — transfer flow', () => {
  beforeEach(() => post.mockResolvedValue({}))

  it('transfers an absolute amount (never a negative) bonus->main', async () => {
    await transferBalance(-300)
    expect(post).toHaveBeenCalledWith('/hall/api/finance/v1/trf/balance', {
      amount: 300,
    })
  })
})

describe('financeApi — recharge flow', () => {
  beforeEach(() => apiPost.mockResolvedValue({ payLink: 'https://pay' }))

  it('posts channel and amount, omitting optional proof when absent', async () => {
    await rechargeBalance(2, 999)
    expect(apiPost).toHaveBeenCalledWith('/hall/api/finance/v1/rc/balance', {
      payChannelId: 2,
      amount: 999,
    })
  })

  it('includes proofImage and paymentRef only when provided', async () => {
    await rechargeBalance(2, 999, 'data:image/png;base64,xx', 'UTR123456789012')
    expect(apiPost).toHaveBeenCalledWith('/hall/api/finance/v1/rc/balance', {
      payChannelId: 2,
      amount: 999,
      proofImage: 'data:image/png;base64,xx',
      paymentRef: 'UTR123456789012',
    })
  })

  it('returns the typed pay link from the API', async () => {
    const result = await rechargeBalance(2, 999)
    expect(result.payLink).toBe('https://pay')
  })
})

describe('financeApi — VIP claim', () => {
  beforeEach(() => post.mockResolvedValue({}))

  it('claims the award for the requested vip level', async () => {
    await claimVipAward(5)
    expect(post).toHaveBeenCalledWith('/hall/api/finance/v1/vip/award', {
      vipLevel: 5,
    })
  })
})
