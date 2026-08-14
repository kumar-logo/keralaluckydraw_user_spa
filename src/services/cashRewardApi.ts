import apiClient, { apiGet, apiPost } from './api'

export const getCashRewardInfo = () =>
  apiGet('/game/api/cash_rain/v1/info')

export const startCashReward = (gameID: number, roundNo: number) =>
  apiPost('/game/api/cash_rain/v1/start', {
    gameID,
    roundNo,
  })

export const endCashReward = (gameID: number, roundNo: number, prize: number) =>
  apiClient.post('/game/api/cash_rain/v1/over', {
    gameID,
    roundNo,
    prize,
  })
