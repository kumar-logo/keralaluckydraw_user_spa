import { apiGet, apiPost, type PageResult } from './api'

export interface ColorTabDto {
  colorID: number
  tabMin: number
  stopSec?: number
}

export interface ColorTicketSeed {
  item: string
}

export interface ColorGameInfoDto {
  colorID: number
  tabMin?: number
  roundNo?: string
  status?: number
  stopSec?: number
  lessSec?: number
  drawTimeSec?: number
  lastRoundNo?: string
  lastResult?: string
  tabs?: ColorTabDto[]
  tickets?: ColorTicketSeed[]
  palette?: Record<string, string>
  numberColors?: Record<string, string[]>
}

export interface ColorHistoryItem {
  roundNo: string
  issueNo: string
  number: number
}

export interface ColorOrderTicketDto {
  betItem: string
  amount: number
  fee: number
  prize: number
  status: number
  createTime: number
}

export interface ColorOrderDto {
  orderGroup: string
  orderNo: string
  roundNo: string
  tabMin: number
  wonCode: string
  totalAmount: number
  totalPrize: number
  createTime: number
  tickets: ColorOrderTicketDto[]
}

export interface ColorDrawResultDto {
  roundNo: string
  totalPrize: number
}

export interface ColorOrderListParams {
  colorID?: number
  pageNo: number
  size: number
  pageSize?: number
  orderStatus: number
  yearMonth: string
}

export interface ColorOrderCreatePayload {
  colorID: number
  roundNo: string
  amount: number
  betItem: string
  multiples: number
}

export const getColorGameInfo = (colorID: number | string) =>
  apiGet<ColorGameInfoDto>(`/game/api/color/v1/game/info?colorID=${colorID}`)

export const getColorDrawHistory = (colorID: number, pageNo: number, size: number) =>
  apiPost<PageResult<ColorHistoryItem>>('/game/api/color/v1/draw/history', {
    colorID,
    pageNo,
    size,
  })

export const createColorOrder = (payload: ColorOrderCreatePayload) =>
  apiPost<void>('/game/api/color/v1/order/create', payload)

export const getColorOrderList = (params: ColorOrderListParams) =>
  apiPost<PageResult<ColorOrderDto>>('/game/api/color/v1/order/list', params)

export const getColorDrawResult = (colorID: number, roundNo: string) =>
  apiPost<ColorDrawResultDto>('/game/api/color/v1/draw/result', {
    colorID,
    roundNo,
  })
