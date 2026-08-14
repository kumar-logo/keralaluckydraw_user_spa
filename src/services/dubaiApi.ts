import { apiGet, apiPost } from './api'
import { CodeEntry } from '../components/order_detail/orderDetailTypes'

export interface DubaiTab {
  roundNo: string
  drawTime?: number | string
  drawTimeLess?: number
  status?: number
}

export interface DubaiLastResult {
  roundNo?: string | number
  drawResult?: string
  number?: string | number | null
  drawTime?: string | number | null
}

export interface DubaiPrizeNotification {
  amount?: number
  spin?: number
  tickets?: number
  autoClose?: boolean | number
  jackpotCutoff?: number
}

export interface DubaiGameInfo {
  gameID: number
  gameName?: string
  gameType?: number
  isManual?: boolean
  price?: number
  payRate?: number
  numberOdds?: Record<string, number>
  numberMin?: number
  numberMax?: number
  themeColor?: string
  status?: number
  roundNo?: string
  stopBettingSec?: number
  drawTimeSec?: number
  lessSec?: number
  cover?: string
  assetBackground?: string
  assetIcons?: Record<string, string>
  tabs?: DubaiTab[]
  lastResult?: DubaiLastResult
  lastPrize?: number | DubaiPrizeNotification
  notStarted?: boolean
  startDate?: string | null
  startTimeSec?: number
}

export interface DubaiDrawHistoryParams {
  gameID: number | string
  pageNo: number
  pageSize: number
}

export interface DubaiDrawRow {
  roundNo: string
  result: string
  drawSec: number
  drawDayStr?: string
  drawTimeStr?: string
}

export interface DubaiDrawHistory {
  content: DubaiDrawRow[]
  totalSize: number
}

export interface DubaiOrderEntry {
  number: number
  amount: number
}

export interface DubaiOrderResult {
  orderNo?: string
  orderGroup?: string
}

export interface DubaiOrderRecord {
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
  codeList?: CodeEntry[]
}

export interface DubaiOrderListParams {
  gameID?: number | string
  pageNo: number
  pageSize: number
  size?: number
  orderStatus?: number
  yearMonth?: string
}

export interface DubaiOrderList {
  content: DubaiOrderRecord[]
  totalSize: number
}

export const getDubaiGameInfo = (gameID: number) =>
  apiGet<DubaiGameInfo>('/game/api/dubai/v1/game/info?gameID=' + gameID)

export const getDubaiDrawHistory = (params: DubaiDrawHistoryParams) =>
  apiPost<DubaiDrawHistory>('/game/api/dubai/v1/draw/history', params)

export const createDubaiOrder = (gameID: number, roundNo: string | number, orders: DubaiOrderEntry[]) =>
  apiPost<DubaiOrderResult>('/game/api/dubai/v1/order/create', {
    gameID,
    roundNo,
    orders,
  })

export const getDubaiOrderList = (params: DubaiOrderListParams) =>
  apiPost<DubaiOrderList>('/game/api/dubai/v1/order/list', params)
