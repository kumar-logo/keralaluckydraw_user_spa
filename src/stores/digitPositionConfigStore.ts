import { create } from 'zustand'
import apiClient from '../services/api'

export interface DigitPositionEntry {
  colors: string[]
  labels: string[]
}

type DigitPositionMap = Record<string, DigitPositionEntry>

interface DigitPositionConfigState {
  configs: DigitPositionMap
  loaded: boolean
  fetchConfigs: () => Promise<void>
  getByGameId: (gameId?: number | string) => DigitPositionEntry
}

const EMPTY_ENTRY: DigitPositionEntry = { colors: [], labels: [] }

export const useDigitPositionConfigStore = create<DigitPositionConfigState>((set, get) => ({
  configs: {},
  loaded: false,
  fetchConfigs: async () => {
    if (get().loaded) return
    try {
      const res = (await apiClient.get('/hall/api/oper/v1/digit-position-config')) as unknown as DigitPositionMap
      set({ configs: res || {}, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },
  getByGameId: (gameId) => {
    if (gameId == null) return EMPTY_ENTRY
    return get().configs[String(gameId)] ?? EMPTY_ENTRY
  },
}))

export const gameIdFromDrawNo = (drawNo?: string): string => {
  if (!drawNo) return ''
  const offset = drawNo.length >= 17 ? 8 : 6
  if (drawNo.length < offset + 4) return ''
  const gid = Number(drawNo.slice(offset, offset + 4))
  if (!Number.isFinite(gid) || gid <= 0) return ''
  return String(gid)
}
