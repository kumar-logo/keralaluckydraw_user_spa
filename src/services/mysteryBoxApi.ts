import { apiGet, apiPost } from './api'

export interface MysteryBoxItem {
  itemID: number
  name?: string
  icon?: string
  imgID?: string
  prize?: number
  rate?: number
}

export interface MysteryBox {
  gameID: number
  gameName?: string
  price: number
  freeCount: number
  icon?: string
  iconImgID?: string
  cover?: string
  coverImgID?: string
  emergencyStop?: number
  items: MysteryBoxItem[]
}

export interface MysteryBoxGroup extends Omit<MysteryBox, 'items'> {
  topPrize: number
  totalFreeCount: number
  items: MysteryBox[]
}

export interface MysteryBoxDrawResult {
  winItem: number | string
  winAmount?: number
}

export interface MysteryBoxDrawHistoryParams {
  gameID: number
  pageNo: number
  pageSize: number
}

export const getMysteryBoxGameList = () =>
  apiGet<MysteryBox[]>('/game/api/mystery_box/v1/game/list')

export const drawMysteryBox = (gameID: number, count: number) =>
  apiPost<MysteryBoxDrawResult[]>('/game/api/mystery_box/v1/game/draw', {
    gameID,
    count,
  })

export const getMysteryBoxDrawHistory = (params: MysteryBoxDrawHistoryParams) =>
  apiPost('/game/api/mystery_box/v1/game/draw/history', params)

export const getMysteryBoxBarrage = (count: number) =>
  apiPost('/game/api/mystery_box/v1/game/barrage', {
    count,
  })
