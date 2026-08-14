import { apiGet, apiPost } from './api'
import { formatDate } from '../utils/date'
import { SlatProductView } from '../config/slatConstants'
import { DigitCodeEntry } from '../components/order_detail/orderDetailTypes'

export interface ThreeDigitPickInfo {
  pickInfoId: number
  pickLevel: number
  pickAmount: number
  pickWinAmount: number[]
}

export interface ThreeDigitTab {
  roundNo: string
  drawTime?: number | string
  drawTimeLess?: number
  drawTimeSec?: number
  status?: number
  drawResult?: string
  cycle?: number
  pickThreeID?: number
  gameId?: number
  colorID?: number
  id?: number
}

export interface ThreeDigitPickTime {
  roundNo: string
  drawNo?: string
  drawTime?: string
  drawTimeLess?: number
  drawTimeLong?: number
  drawTimeSec?: number
  status?: number
  drawResult?: string
  icon?: string
  cycle?: number
  stopBetSec?: number
}

export interface ThreeDigitLastResult {
  roundNo?: string | number
  drawResult?: string
}

export interface ThreeDigitCurrentRound {
  roundNo?: string
  drawTime?: string
  drawTimeLong?: number
  drawTimeSec?: number
  status?: number
  stopBetSec?: number
  cycle?: number
  icon?: string
}

export interface ThreeDigitGameInfo {
  gameName?: string
  icon?: string
  isManual?: boolean
  digitCount?: number
  roundNo?: string
  drawNo?: string
  status?: number
  drawTimeLong?: number
  drawTimeSec?: number
  stopBetSec?: number
  cycle?: number
  tabs?: ThreeDigitTab[]
  pickTimes?: ThreeDigitPickTime[]
  pickInfos?: ThreeDigitPickInfo[]
  slatProducts?: SlatProductView[]
  lastResult?: ThreeDigitLastResult
  positionColors?: string[]
  positionGradients?: string[][]
  positionLabels?: string[]
  notStarted?: boolean
  startDate?: string | null
  startTimeSec?: number
}

export interface ThreeDigitDrawRow {
  roundNo: string
  pickNo?: string
  drawTime?: number | string
  drawResult?: string
}

export interface ThreeDigitLastDraw {
  roundNo?: string | number
  drawNo?: string | number
  drawResult?: string
}

export interface ThreeDigitDrawHistory {
  drawResultList?: ThreeDigitDrawRow[]
  totalCount: number
}

export interface ThreeDigitOrderTicket {
  level: number | string
  index: string
  number: string
  count: number
  slatProductId?: number
  positions?: number[]
}

export interface ThreeDigitOrderPayload {
  gameID: number
  roundNo: string
  totalAmount?: number
  tickets: ThreeDigitOrderTicket[]
}

export interface ThreeDigitOrderResult {
  orderNo?: string
  orderGroup?: string
}

export interface ThreeDigitOrderRecord {
  orderGroup?: string
  gameName?: string
  roundNo?: string | number
  drawTime?: number | string
  createTime?: number
  totalAmount?: number
  winAmount?: number
  wonCode?: string
  codeLists?: DigitCodeEntry[]
}

export interface ThreeDigitOrderList {
  totalSize: number
  content: ThreeDigitOrderRecord[]
}

export const getThreeDigitGameInfo = (gameID: number) =>
  apiGet<ThreeDigitGameInfo>('/game/api/three_digit/v1/game/info?gameID=' + gameID)

export const getThreeDigitDrawHistory = (gameID: number, pageNo: number, size = 10) =>
  apiPost<ThreeDigitDrawHistory>('/game/api/three_digit/v1/draw/history', {
    gameID,
    pageNo,
    size,
  })

export const createThreeDigitOrder = (payload: ThreeDigitOrderPayload) =>
  apiPost<ThreeDigitOrderResult>('/game/api/three_digit/v1/order/create', payload)

export const getThreeDigitOrderList = (gameID: number, pageNo = 1, size = 10, yearMonth = formatDate(new Date(), 'yyyyMM')) =>
  apiPost<ThreeDigitOrderList>('/game/api/three_digit/v1/order/list', {
    gameID,
    pageNo,
    size,
    yearMonth,
  })

export const getThreeDigitLatestDraw = () =>
  apiGet<ThreeDigitDrawRow>('/game/api/three_digit/v1/draw/history/latest')

export interface DigitLatestDrawRow {
  drawNo: string
  drawResult: string
  drawTime: string
  gameName?: string
  icon?: string
}

export interface DigitManualHistoryPage {
  content: DigitLatestDrawRow[]
  totalSize: number
  pageNo: number
  pageSize: number
}

export const getThreeDigitQuickDraw = () =>
  apiGet<DigitLatestDrawRow[]>('/game/api/three_digit/v1/draw/history/quick')

export const getThreeDigitManualHistory = (pageNo: number, pageSize = 10) =>
  apiPost<DigitManualHistoryPage>('/game/api/three_digit/v1/draw/history/manual', {
    pageNo,
    pageSize,
  })
