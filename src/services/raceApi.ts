import { apiGet, apiPost, type PageResult } from './api'
import type { RaceRunner } from '../config/raceConstants'

export interface RacePayRateDto {
  type: number
  odds: number
}

export interface RaceTabDto {
  id: number
  count: number
}

export interface RaceLastResultDto {
  roundNo: string
}

export interface RaceGameInfoDto {
  gameID: number
  roundNo: string
  status?: number
  runnerCount?: number
  drawTimeSec: number
  stopBettingSec?: number
  frameSec?: number
  lastPrize?: number
  lastResult?: RaceLastResultDto
  last100Top1?: Record<number, number>
  payRate?: RacePayRateDto[]
  raceRunners?: RaceRunner[]
  tabs?: RaceTabDto[]
}

export interface RaceFramePoint {
  point: number
  speedStatus: number
}

export interface RaceFrameObstacle {
  point: number
  speedModulus: number
}

export interface RaceRunnerFrameDto {
  number: number
  frameData: RaceFramePoint[]
  items?: RaceFrameObstacle[]
}

export interface RaceDrawHistoryItem {
  roundNo: string
  resultTop3: string
}

export interface RaceBetEntryDto {
  type?: number
  betNum: string
  amount: number
  prize: number
  status: number
}

export interface RaceOrderDto {
  orderGroup: string
  roundNo: string
  gameName?: string
  runnerCount?: number
  resultTop3?: string
  drawTime?: number | string
  createTime?: number
  codeList: RaceBetEntryDto[]
}

export interface RaceOrderItemDto {
  orderType: number
  amount: number
  betNum: string
}

export interface RaceOrderCreatePayload {
  gameID: number
  roundNo: string
  orders: RaceOrderItemDto[]
}

export interface RaceDrawHistoryParams {
  pageNo: number
  pageSize: number
  gameID: number
}

export interface RaceOrderListParams {
  pageNo: number
  pageSize?: number
  size?: number
  gameID?: number
  orderStatus: number
  yearMonth?: string
}

export const getRaceGameInfo = (gameID: number) =>
  apiGet<RaceGameInfoDto>('/game/api/race/v1/game/info?gameID=' + gameID)

export const getRaceRunnerFrames = (gameID: number) =>
  apiGet<RaceRunnerFrameDto[]>('/game/api/race/v1/runner/frames?gameID=' + gameID)

export const createRaceOrder = (data: RaceOrderCreatePayload) =>
  apiPost<void>('/game/api/race/v2/order/create', data)

export const getRaceDrawHistory = (data: RaceDrawHistoryParams) =>
  apiPost<PageResult<RaceDrawHistoryItem>>('/game/api/race/v1/draw/history', data)

export const getRaceOrderList = (data: RaceOrderListParams) =>
  apiPost<PageResult<RaceOrderDto>>('/game/api/race/v1/order/list', data)
