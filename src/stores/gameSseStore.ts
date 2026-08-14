import { create } from 'zustand'
import { getApiBaseUrl } from '../config/env'

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

interface SseMessage extends GameUpdateMessage, DrawResultMessage {
  kind?: string
}

interface GameSseState {
  connected: boolean
  serverOffset: number
  rounds: Record<number, RoundState>
  results: Record<number, DrawResultState>
  connect: () => Promise<void>
  subscribe: (gameId: number) => void
  unsubscribe: (gameId: number) => void
}

enum GameEventKind {
  GameUpdate = 'game_update',
  DrawResult = 'draw_result',
  Heartbeat = 'heartbeat',
}

let source: EventSource | null = null
let rebuildTimer: ReturnType<typeof setTimeout> | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let backoffMs = 1000
let visibilityBound = false
const subCounts = new Map<number, number>()

const toMs = (v: unknown): number => {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const t = new Date(v).getTime()
    return Number.isNaN(t) ? 0 : t
  }
  return 0
}

const buildUrl = (): string | null => {
  const ids = [...subCounts.keys()]
  if (ids.length === 0) return null
  const base = getApiBaseUrl()
  const root = base && base !== '/' ? base.replace(/\/$/, '') : ''
  return `${root}/game/api/events/stream?gameIds=${ids.join(',')}`
}

export const useGameSseStore = create<GameSseState>((set, get) => {
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

  const scheduleReconnect = () => {
    if (reconnectTimer) return
    if (subCounts.size === 0) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      backoffMs = Math.min(backoffMs * 2, 30000)
      rebuild()
    }, backoffMs)
  }

  const rebuild = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    const url = buildUrl()
    if (source) {
      source.close()
      source = null
      set({ connected: false })
    }
    if (!url) return
    const es = new EventSource(url)
    source = es
    es.onopen = () => {
      backoffMs = 1000
      set({ connected: true })
    }
    es.onerror = () => {
      set({ connected: false })
      if (es.readyState === EventSource.CLOSED) scheduleReconnect()
    }
    es.onmessage = (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data) as SseMessage
        applyOffset(Number(msg?.serverTime) || 0)
        if (msg?.kind === GameEventKind.DrawResult) handleDrawResult(msg)
        else if (msg?.kind === GameEventKind.GameUpdate) handleGameUpdate(msg)
      } catch {
        return
      }
    }
  }

  const scheduleRebuild = () => {
    if (rebuildTimer) clearTimeout(rebuildTimer)
    rebuildTimer = setTimeout(rebuild, 50)
  }

  const connect = async (): Promise<void> => {
    scheduleRebuild()
  }

  const subscribe = (gameId: number) => {
    if (!gameId) return
    subCounts.set(gameId, (subCounts.get(gameId) || 0) + 1)
    scheduleRebuild()
  }

  const unsubscribe = (gameId: number) => {
    if (!gameId) return
    const next = (subCounts.get(gameId) || 0) - 1
    if (next <= 0) subCounts.delete(gameId)
    else subCounts.set(gameId, next)
    scheduleRebuild()
  }

  if (typeof document !== 'undefined' && !visibilityBound) {
    visibilityBound = true
    document.addEventListener('visibilitychange', () => {
      if (
        document.visibilityState === 'visible' &&
        subCounts.size > 0 &&
        (!source || source.readyState !== EventSource.OPEN)
      ) {
        rebuild()
      }
    })
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
