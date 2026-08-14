import { apiGet, apiPost } from './api'
import { SlatProductView } from '../config/slatConstants'
import { DigitCodeEntry } from '../components/order_detail/orderDetailTypes'

export interface FourFiveDigitTab {
  roundNo: string
  drawTime?: number | string
  drawTimeLess?: number
  status?: number
}

export interface FourFiveDigitPrizeTier {
  prize: number
}

export interface FourFiveDigitLastResult {
  roundNo?: string | number
  drawResult?: string
}

export interface FourFiveDigitPrizeNotification {
  amount?: number
  spin?: number
  tickets?: number
  autoClose?: boolean | number
  jackpotCutoff?: number
}

export interface FourFiveDigitGameInfo {
  gameName?: string
  icon?: string
  gameType?: number
  isManual?: boolean
  status?: number
  roundNo?: string
  stopBettingSec?: number
  pick4Price?: number
  pick5Price?: number
  pick4Prize?: FourFiveDigitPrizeTier[]
  pick5Prize?: FourFiveDigitPrizeTier[]
  tabs?: FourFiveDigitTab[]
  slatProducts?: SlatProductView[]
  lastResult?: FourFiveDigitLastResult
  lastPrize?: FourFiveDigitPrizeNotification
  positionColors?: string[]
  positionGradients?: string[][]
  positionLabels?: string[]
  notStarted?: boolean
  startDate?: string | null
  startTimeSec?: number
}

export interface FourFiveDigitDrawRow {
  roundNo: string
  drawTime?: number | string
  drawResult?: string
}

export interface FourFiveDigitDrawHistoryParams {
  gameID: number
  pageNo: number
  pageSize: number
}

export interface FourFiveDigitDrawHistory {
  content: FourFiveDigitDrawRow[]
  totalSize: number
}

export interface FourFiveDigitOrderEntry {
  count: number
  number: string
  type: number | string
  slatProductId?: number
  positions?: number[]
}

export interface FourFiveDigitOrderPayload {
  gameID: number
  roundNo: string
  orders: FourFiveDigitOrderEntry[]
}

export interface FourFiveDigitOrderResult {
  orderNo?: string
  orderGroup?: string
}

export interface FourFiveDigitOrderRecord {
  orderGroup?: string
  gameName?: string
  roundNo?: string | number
  drawTime?: number | string
  createTime?: number
  totalAmount?: number
  totalPrize?: number
  status?: number
  result?: string
  icon?: string
  codeLists?: DigitCodeEntry[]
}

export interface FourFiveDigitOrderListParams {
  gameID?: number
  pageNo: number
  pageSize?: number
  size?: number
  orderStatus?: number
  yearMonth?: string
}

export interface FourFiveDigitOrderList {
  content: FourFiveDigitOrderRecord[]
  totalSize: number
}

export interface FourFiveDigitLatestDraw {
  drawNo: string
  drawResult: string
  drawTime: string
  gameName?: string
  icon?: string
}

export const getFourFiveDigitGameInfo = (gameID: number) =>
  apiGet<FourFiveDigitGameInfo>('/game/api/four_five_digit/v1/game/info?gameID=' + gameID)

export const getFourFiveDigitDrawHistory = (params: FourFiveDigitDrawHistoryParams) =>
  apiPost<FourFiveDigitDrawHistory>('/game/api/four_five_digit/v1/draw/history', params)

export const createFourFiveDigitOrder = (payload: FourFiveDigitOrderPayload) =>
  apiPost<FourFiveDigitOrderResult>('/game/api/four_five_digit/v1/order/create', payload)

export const getFourFiveDigitOrderList = (params: FourFiveDigitOrderListParams) =>
  apiPost<FourFiveDigitOrderList>('/game/api/four_five_digit/v1/order/list', params)

export const getFourFiveDigitLatestDraw = () =>
  apiGet<FourFiveDigitLatestDraw[]>('/game/api/four_five_digit/v1/draw/history/latest')

export interface FourFiveDigitManualHistoryPage {
  content: FourFiveDigitLatestDraw[]
  totalSize: number
  pageNo: number
  pageSize: number
}

export const getFourFiveDigitQuickDraw = () =>
  apiGet<FourFiveDigitLatestDraw[]>('/game/api/four_five_digit/v1/draw/history/quick')

export const getFourFiveDigitManualHistory = (pageNo: number, pageSize = 10) =>
  apiPost<FourFiveDigitManualHistoryPage>('/game/api/four_five_digit/v1/draw/history/manual', {
    pageNo,
    pageSize,
  })
