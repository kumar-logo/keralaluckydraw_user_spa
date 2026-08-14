import { create } from 'zustand'
import { type Socket } from 'socket.io-client'
import { getApiBaseUrl } from '../config/env'
import { useAuthStore } from './authStore'

export interface RoundState {
  roundNo: string
  status: number
  drawTime: number
  stopBetTime: number
  serverTime: number
  receivedAt: number
}

export interface DrawResultPayload {
  number?: string | number | null
  drawResult?: string
  drawTime?: number | string | null
  prize?: number | null
}

export interface DrawResultState {
  roundNo: string
  result: DrawResultPayload
  serverTime: number
  receivedAt: number
}

interface GameUpdateMessage {
  gameId?: number | string
  type?: string
  roundNo?: number | string
  status?: number
  drawTime?: number | string
  stopBetTime?: number | string
  serverTime?: number
}

interface DrawResultMessage {
  gameId?: number | string
  roundNo?: number | string
  result?: DrawResultPayload
  serverTime?: number
}

interface GameSocketState {
  connected: boolean
  serverOffset: number
  rounds: Record<number, RoundState>
  results: Record<number, DrawResultState>
  connect: () => Promise<void>
  subscribe: (gameId: number) => void
  unsubscribe: (gameId: number) => void
}

let socket: Socket | null = null
let connecting = false
const roomCounts = new Map<number, number>()

export const resetSocket = (): void => {
  socket?.disconnect()
  socket = null
  connecting = false
}

const toMs = (v: unknown): number => {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const t = new Date(v).getTime()
    return Number.isNaN(t) ? 0 : t
  }
  return 0
}

export const useGameSocketStore = create<GameSocketState>((set, get) => {
  const applyOffset = (serverTime?: number) => {
    if (!serverTime) return
    const offset = serverTime - Date.now()
    const prev = get().serverOffset
    const next = prev === 0 ? offset : Math.round(prev * 0.7 + offset * 0.3)
    set({ serverOffset: next })
  }

  const handleGameUpdate = (msg: GameUpdateMessage) => {
    const gameId = Number(msg?.gameId)
    if (!gameId) return
    applyOffset(Number(msg?.serverTime) || 0)
    if (msg?.type === 'new_round' || msg?.type === 'betting_closed') {
      set((s) => ({
        rounds: {
          ...s.rounds,
          [gameId]: {
            roundNo: String(msg.roundNo),
            status:
              typeof msg.status === 'number'
                ? msg.status
                : msg.type === 'new_round'
                  ? 0
                  : 1,
            drawTime: toMs(msg.drawTime),
            stopBetTime: toMs(msg.stopBetTime),
            serverTime: Number(msg.serverTime) || Date.now(),
            receivedAt: Date.now(),
          },
        },
      }))
    }
  }

  const handleDrawResult = (msg: DrawResultMessage) => {
    const gameId = Number(msg?.gameId)
    if (!gameId) return
    applyOffset(Number(msg?.serverTime) || 0)
    set((s) => ({
      results: {
        ...s.results,
        [gameId]: {
          roundNo: String(msg.roundNo),
          result: msg.result ?? {},
          serverTime: Number(msg.serverTime) || Date.now(),
          receivedAt: Date.now(),
        },
      },
    }))
  }

  const connect = async (): Promise<void> => {
    if (socket) {
      if (!socket.connected) socket.connect()
      return
    }
    if (connecting) return
    connecting = true
    const base = getApiBaseUrl()
    const url = base && base !== '/' ? base : undefined
    try {
      const { io } = await import('socket.io-client')
      if (socket) return
      socket = io(url, {
        path: '/ws/internal',
        transports: ['polling', 'websocket'],
        auth: (cb) => cb({ token: useAuthStore.getState().token || undefined }),
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        randomizationFactor: 0.5,
      })
      socket.on('connect', () => {
        set({ connected: true })
        for (const gameId of roomCounts.keys()) socket?.emit('subscribe', { gameId })
      })
      socket.on('disconnect', () => set({ connected: false }))
      socket.on('connect_error', () => set({ connected: false }))
      socket.io.on('reconnect_failed', () => set({ connected: false }))
      socket.on('game_update', handleGameUpdate)
      socket.on('draw_result', handleDrawResult)
    } finally {
      connecting = false
    }
  }

  const subscribe = (gameId: number) => {
    if (!gameId) return
    roomCounts.set(gameId, (roomCounts.get(gameId) || 0) + 1)
    if (socket && socket.connected) socket.emit('subscribe', { gameId })
  }

  const unsubscribe = (gameId: number) => {
    if (!gameId) return
    const next = (roomCounts.get(gameId) || 0) - 1
    if (next <= 0) {
      roomCounts.delete(gameId)
      if (socket && socket.connected) socket.emit('unsubscribe', { gameId })
    } else {
      roomCounts.set(gameId, next)
    }
  }

  return {
    connected: false,
    serverOffset: 0,
    rounds: {},
    results: {},
    connect,
    subscribe,
    unsubscribe,
  }
})

export const syncedSecondsLeft = (
  drawTime?: number,
  serverOffset = 0,
): number => {
  if (!drawTime) return 0
  return Math.max(0, Math.round((drawTime - (Date.now() + serverOffset)) / 1000))
}
