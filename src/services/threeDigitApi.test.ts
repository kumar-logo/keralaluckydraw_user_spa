import { describe, it, expect, beforeEach, vi } from 'vitest'

const { post, get } = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
}))

vi.mock('./api', () => ({
  default: { post, get },
  apiGet: (url: string, config?: unknown) =>
    config === undefined ? get(url) : get(url, config),
  apiPost: (url: string, data?: unknown, config?: unknown) =>
    config === undefined ? post(url, data) : post(url, data, config),
}))

import {
  createThreeDigitOrder,
  getThreeDigitOrderList,
  getThreeDigitGameInfo,
  getThreeDigitQuickDraw,
  getThreeDigitManualHistory,
} from './threeDigitApi'

describe('threeDigitApi — place a (slat) bet', () => {
  beforeEach(() => {
    post.mockResolvedValue({ orderNo: 'O-1' })
    get.mockResolvedValue({})
  })

  it('posts the slat ticket payload verbatim to the create-order endpoint', async () => {
    const payload = {
      gameID: 604,
      roundNo: '20260627-1',
      tickets: [
        {
          level: 'ABC',
          index: 'ABC',
          number: '123',
          count: 1,
          slatProductId: 9,
          positions: [0, 1, 2],
        },
      ],
    }
    await createThreeDigitOrder(payload)
    expect(post).toHaveBeenCalledWith(
      '/game/api/three_digit/v1/order/create',
      payload,
    )
  })

  it('lists My Bets for the game/month with paging', async () => {
    await getThreeDigitOrderList(604, 2, 20, '202606')
    expect(post).toHaveBeenCalledWith('/game/api/three_digit/v1/order/list', {
      gameID: 604,
      pageNo: 2,
      size: 20,
      yearMonth: '202606',
    })
  })

  it('sends yearMonth, the only month key the backend DTO whitelists', async () => {
    await getThreeDigitOrderList(604, 1, 10, '202607')
    const body = post.mock.calls[post.mock.calls.length - 1][1] as Record<string, unknown>
    expect(body).toHaveProperty('yearMonth', '202607')
    expect(body).not.toHaveProperty('month')
  })

  it('fetches game info by id over GET', async () => {
    await getThreeDigitGameInfo(604)
    expect(get).toHaveBeenCalledWith(
      '/game/api/three_digit/v1/game/info?gameID=604',
    )
  })

  it('fetches the auto/quick digit results for the Quick Digits tab', async () => {
    await getThreeDigitQuickDraw()
    expect(get).toHaveBeenCalledWith(
      '/game/api/three_digit/v1/draw/history/quick',
    )
  })

  it('fetches a page of manual-lottery history for the 3-Digit tab Load More', async () => {
    await getThreeDigitManualHistory(2, 10)
    expect(post).toHaveBeenCalledWith(
      '/game/api/three_digit/v1/draw/history/manual',
      { pageNo: 2, pageSize: 10 },
    )
  })
})
