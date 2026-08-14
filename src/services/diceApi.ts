import { apiGet, apiPost, type PageResult } from './api'

export interface DiceOdds {
  sum_big: string
  sum_odd: string
  sum_four: string
  sum_five: string
  sum_six: string
  sum_seven: string
  sum_eight: string
  sum_nine: string
  leopard_one: string
  leopard_any: string
  double_one: string
  single_one: string
  [key: string]: string | undefined
}

export interface DiceTabDto {
  diceID: number
  tabMin: number
}

export interface DiceTicketDto {
  item: string
}

export interface DiceGameInfoDto {
  diceID: number
  tabMin?: number
  roundNo?: string
  status?: number
  stopSec?: number
  lessSec?: number
  drawTimeSec?: number
  lastRoundNo?: string
  lastResult?: string
  lastTotalCount?: number
  lastIsLeopard?: boolean
  odds?: DiceOdds
  palette?: Record<string, string>
  tabs?: DiceTabDto[]
  tickets?: DiceTicketDto[]
}

export interface DiceHistoryItem {
  roundNo: string
  issueNo: string
  result: string
  totalCount: number
}

export interface DiceAnalyzeDto {
  latest: DiceHistoryItem[]
  count1: number
  count2: number
  count3: number
  count4: number
  count5: number
  count6: number
  bigPer: number
  smallPer: number
}

export interface DiceBetDto {
  betItem: string
  amount: number
  basePrice: number
  prize: number
  status: number
  createTime: number
}

export interface DiceOrderDto {
  orderGroup: string
  roundNo: string
  tabMin: number
  drawSec: number
  createTime: number
  totalAmount: number
  result: string
  resultCount: number
  typeList: DiceBetDto[]
}

export interface DiceDrawResultDto {
  roundNo: string
  totalPrize: number
}

export interface DiceOrderListParams {
  diceID?: number
  pageNo: number
  size: number
  pageSize?: number
  orderStatus: number
  yearMonth: string
}

export interface DiceOrderCreatePayload {
  diceID: number
  roundNo: string
  amount: number
  betItem: string
  multiples: number
}

export const DEFAULT_DICE_ODDS: DiceOdds = {
  sum_big: '2',
  sum_odd: '2',
  sum_four: '50',
  sum_five: '20',
  sum_six: '14',
  sum_seven: '12',
  sum_eight: '8',
  sum_nine: '6',
  leopard_one: '150',
  leopard_any: '24',
  double_one: '8',
  single_one: '1.9',
}

export const getDiceGameInfo = (diceID: number | string) =>
  apiGet<DiceGameInfoDto>(`/game/api/dice/v1/game/info?diceID=${diceID}`)

export const getDiceDrawHistory = (diceID: number, pageNo: number, size: number) =>
  apiPost<PageResult<DiceHistoryItem>>('/game/api/dice/v1/draw/history', {
    diceID,
    pageNo,
    size,
  })

export const getDiceDrawAnalyze = (diceID: number, size = 100) =>
  apiPost<DiceAnalyzeDto>('/game/api/dice/v1/draw/analyze', {
    diceID,
    size,
  })

export const createDiceOrder = (payload: DiceOrderCreatePayload) =>
  apiPost<void>('/game/api/dice/v1/order/create', payload)

export const getDiceOrderList = (params: DiceOrderListParams) =>
  apiPost<PageResult<DiceOrderDto>>('/game/api/dice/v1/order/list', params)

export const getDiceDrawResult = (diceID: number, roundNo: string) =>
  apiPost<DiceDrawResultDto>('/game/api/dice/v1/draw/result', {
    diceID,
    roundNo,
  })
