import { apiGet, apiPost, PageResult } from './api'

export const getKeralaUrlPrefix = (variant: string): string =>
  variant === 'KeralaC' ? 'kerala' : 'kerala'

export interface KeralaTab {
  roundNo: string
  drawTime?: number | string
  drawTimeLess?: number
  status?: number
}

export interface KeralaLastResult {
  roundNo?: string | number
  drawResult?: string
}

export interface KeralaGameInfo {
  keralaID: number
  keralaName?: string
  gameName?: string
  icon?: string
  roundNo?: string | number
  status?: number
  isManual?: boolean
  digitCount?: number
  price?: number
  stopSec?: number
  canInsurance?: boolean
  prefix1st?: string
  prefix2ndList?: string[]
  lastCode?: string
  lastPrefix?: string
  drawTimeSec?: number
  drawTimeLong?: number
  tabs?: KeralaTab[]
  lastResult?: KeralaLastResult
  notStarted?: boolean
  startDate?: string | null
  startTimeSec?: number
}

export interface KeralaPrizeTier {
  level: string
  prize: number
  codes: string[]
}

export interface KeralaDrawDetail {
  roundNo?: string | number
  drawTime?: number
  codeList?: KeralaPrizeTier[]
}

export interface KeralaDrawDetailList {
  records: KeralaDrawDetail[]
  totalSize: number
}

export interface KeralaOrderCodeEntry {
  code: string
  amount?: number
  prize?: number
  status?: number
}

export interface KeralaOrderRecord {
  orderGroup?: string
  keralaName?: string
  roundNo?: string | number
  drawTime?: number
  createTime?: number
  result1st?: string
  totalPrize: number
  tags?: string
  codeList: KeralaOrderCodeEntry[]
}

export interface KeralaOrderListParams {
  keralaID: number
  pageNo: number
  size: number
  orderStatus: number
  yearMonth: string
}

export interface KeralaDrawDetailListParams {
  keralaID: number
  pageNo: number
  size: number
}

export interface KeralaOrderPayload {
  keralaID?: number
  roundNo?: string | number
  codes: string[]
}

export interface KeralaOrderResult {
  orderNo?: string
  orderGroup?: string
}

export interface KeralaLatestDraw {
  roundNo?: string | number
  gameId?: number
  drawResult?: string
  drawTime?: string | number
  icon?: string
  prizes?: { first?: string }
}

export const getKeralaGameInfo = (keralaID: number, variant: string) =>
  apiGet<KeralaGameInfo>(`/game/api/${getKeralaUrlPrefix(variant)}/v1/game/info`, {
    params: { keralaID },
  })

export const getKeralaDrawDetail = (keralaID: number, roundNo: string, variant: string) =>
  apiPost<KeralaDrawDetail>(`/game/api/${getKeralaUrlPrefix(variant)}/v1/draw/detail`, {
    roundNo,
    keralaID,
  })

export const getKeralaRandomOrder = (keralaID: number, count: number, variant: string) =>
  apiPost<string[]>(`/game/api/${getKeralaUrlPrefix(variant)}/v1/order/random`, {
    keralaID,
    count,
  })

export const createKeralaOrder = (payload: KeralaOrderPayload, variant: string, withInsurance = false) =>
  apiPost<KeralaOrderResult>(`/game/api/${getKeralaUrlPrefix(variant)}/v1/order/create${withInsurance ? '/insurance' : ''}`, payload)

export const getKeralaOrderList = (params: KeralaOrderListParams, variant: string) =>
  apiPost<PageResult<KeralaOrderRecord>>(`/game/api/${getKeralaUrlPrefix(variant)}/v1/order/list`, params)

export const getKeralaDrawDetailList = (params: KeralaDrawDetailListParams, variant: string) =>
  apiPost<KeralaDrawDetailList>(`/game/api/${getKeralaUrlPrefix(variant)}/v1/draw/detail/list`, params)

export const getKeralaOrderCustom = (keralaID: number, code: string, variant: string) =>
  apiPost<boolean>(`/game/api/${getKeralaUrlPrefix(variant)}/v1/order/custom`, {
    keralaID,
    code,
  })

export const getKeralaOfficialLatestDraw = () =>
  apiGet<KeralaLatestDraw[]>('/game/api/kerala/v1/draw/history/latest')
