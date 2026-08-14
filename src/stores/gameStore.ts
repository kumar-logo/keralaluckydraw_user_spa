import { create } from 'zustand'
import apiClient from '../services/api'
import { HomeGame, HomeProvider } from '../services/hallApi'


interface FilterIcon {
  lightUrl: string
  url: string
  width: number
  height: number
}

interface GameStore {
  collectList: HomeGame[]
  recentlyPlayedList: HomeGame[]
  providers: HomeProvider[]
  filterIcon: FilterIcon
  addRecentlyPlayed: (game: HomeGame) => void
  updateCollect: (game: HomeGame, collect: boolean) => Promise<unknown>
  updateCollectList: (list: HomeGame[]) => void
  updateRecentlyPlayedList: (list: HomeGame[]) => void
  updateProvider: (list: HomeProvider[]) => void
  updateFilterIcon: (icon: FilterIcon) => void
}

const setGameCollectApi = (gameCode: string, collect: boolean) =>
  apiClient.post('/hall/api/oper/v3/collect/set', { gameCode, collect })

export const useGameStore = create<GameStore>((set) => ({
  collectList: [],
  recentlyPlayedList: [],
  providers: [],
  filterIcon: { lightUrl: '', url: '', width: 0, height: 0 },

  addRecentlyPlayed: (game) => {
    set(({ recentlyPlayedList }) => {
      const updated = [...recentlyPlayedList.map((item) => ({ ...item }))]
      const existingIndex = updated.findIndex((item) => item.gameCode === game.gameCode)
      if (existingIndex > -1) updated.splice(existingIndex, 1)
      updated.unshift(game)
      return { recentlyPlayedList: updated }
    })
  },

  updateCollect: (game, collect) => {
    set(({ collectList }) => {
      const updated = [...collectList.map((item) => ({ ...item }))]
      if (collect) {
        updated.unshift(game)
        return { collectList: updated }
      }
      const index = updated.findIndex((item) => item.gameCode === game.gameCode)
      if (index > -1) {
        updated.splice(index, 1)
        return { collectList: updated }
      }
      return {}
    })
    return setGameCollectApi(game.gameCode, collect)
  },

  updateCollectList: (list) => set({ collectList: list }),
  updateRecentlyPlayedList: (list) => set({ recentlyPlayedList: list }),
  updateProvider: (list) => set({ providers: list }),
  updateFilterIcon: (icon) => set({ filterIcon: icon }),
}))
