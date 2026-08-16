import { apiGet, apiPost } from './api'

export interface LuckySpinInfoDto {
  price?: number
  freeCount?: number
  gameID?: number
  image?: string
  banner?: string
}

export interface LuckySpinDrawDto {
  prizeIndex?: number
  prizeAmount?: number
  prizeSpin?: number
}

export interface LuckySpinDrawHistoryItemDto {
  betAmount: number
  count: number
  prizeAmount: number
  prizeSpin: number
}

export interface LuckySpinFreeHistoryItemDto {
  avatar: string
  nickName: string
  count: number
  time: string
}

export interface LuckySpinBarrageItemDto {
  avatar: string
  userPhone: string
  prizeAmount: number
}

interface ListWrapper<T> { list?: T[] }

export const getLuckySpinInfo = () =>
  apiGet<LuckySpinInfoDto>('/game/api/lucky_spin/v1/info')

export const drawLuckySpin = (count: number, gameID: number) =>
  apiPost<LuckySpinDrawDto>('/game/api/lucky_spin/v1/draw', {
    count,
    gameID,
  })

export const getLuckySpinDrawHistory = (params: { gameID: number; pageNo: number; pageSize: number }) =>
  apiPost<ListWrapper<LuckySpinDrawHistoryItemDto> | LuckySpinDrawHistoryItemDto[]>('/game/api/lucky_spin/v1/draw/history', params)

export const getLuckySpinFreeHistory = (params: { gameID: number; pageNo: number; pageSize: number }) =>
  apiPost<ListWrapper<LuckySpinFreeHistoryItemDto> | LuckySpinFreeHistoryItemDto[]>('/game/api/lucky_spin/v1/free/history', params)

export const getLuckySpinBarrage = (count = 100) =>
  apiGet<LuckySpinBarrageItemDto[]>(`/game/api/lucky_spin/v1/barrage?count=${count}`)
