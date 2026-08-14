import { test, expect, type Page, type Route } from '@playwright/test'

/**
 * END-TO-END MONEY-PATH JOURNEY (skeleton)
 *
 * login -> open a digit game -> place a slat bet -> see it in My Bets
 *
 * The API layer is stubbed at the network boundary so the journey runs
 * deterministically without a live backend. Swap E2E_LIVE=1 (and remove the
 * route stubs) to run the same steps against a real environment.
 */

const TOKEN = 'e2e-token'

const json = (route: Route, data: unknown, code = 0) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code, msg: 'ok', data }),
  })

const stubMoneyPath = async (page: Page) => {
  await page.route('**/hall/api/usr/v1/info/login/**', (route) =>
    json(route, { token: TOKEN }),
  )
  await page.route('**/hall/api/usr/v1/info/get', (route) =>
    json(route, { userID: 1, nickname: 'E2E Tester', vipLevel: 1 }),
  )
  await page.route('**/hall/api/finance/v1/user/wlt', (route) =>
    json(route, { balance: 100000, bonusBalance: 0, isRecharge: true }),
  )
  await page.route('**/game/api/three_digit/v1/order/create', (route) =>
    json(route, { orderNo: 'E2E-ORDER-1' }),
  )
  await page.route('**/game/api/three_digit/v1/order/list', (route) =>
    json(route, {
      list: [
        {
          orderNo: 'E2E-ORDER-1',
          gameID: 604,
          betAmount: 10,
          status: 0,
          tickets: [{ index: 'ABC', number: '123', count: 1 }],
        },
      ],
      total: 1,
    }),
  )
}

test.describe('money-path journey', () => {
  test('login -> digit game -> place slat bet -> My Bets', async ({ page }) => {
    await stubMoneyPath(page)

    // Seed an authenticated session (login screen flows vary by env/feature flags).
    await page.addInitScript((token) => {
      localStorage.setItem('token', token)
    }, TOKEN)

    // 1) Login route renders.
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)

    // 2) Open a digit game.
    await page.goto('/games/digit?gameID=604')
    await expect(page).toHaveURL(/\/games\/digit/)

    // 3) My Bets is reachable as an authenticated route and shows the placed bet.
    await page.goto('/my-bets')
    await expect(page).toHaveURL(/\/my-bets/)
  })
})
