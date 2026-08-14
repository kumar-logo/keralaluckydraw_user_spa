import { create } from 'zustand'
import { getWsHost } from '../config/env'

export interface WsMessage {
  type?: string
  [key: string]: unknown
}

interface WsStore {
  connected: boolean
  messageMap: Record<string, WsMessage[]>
  lastSystemMessageIndex: number
  setLastSystemMessageIndex: (i: number) => void
  setMessageMap: (patch: Record<string, WsMessage[]>) => void
  shiftMessageByType: (type: string) => WsMessage | null
  clearMessageByType: (type: string) => void
  connect: () => void
  close: () => void
  send: (cmd: number, data?: unknown, waitReply?: boolean, timeout?: number) => Promise<unknown> | null
}

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let seqId = 0
let reconnectAttempts = 0
const RECONNECT_MAX_ATTEMPTS = 10
const RECONNECT_BASE_MS = 1000
const RECONNECT_CAP_MS = 30000
const WAIT_REPLY_MAX_RETRIES = 3
const WAIT_REPLY_BACKOFF_MS = 300
const pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void; timeoutId: ReturnType<typeof setTimeout> }>()

const sendQueue: Array<{ cmd: number; data?: unknown; waitReply: boolean; timeout: number; resolve?: (v: unknown) => void; reject?: (e: Error) => void }> = []

export const useWsStore = create<WsStore>((set) => {
  const startHeartbeat = () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    heartbeatTimer = setInterval(() => {
      sendMsg(700, { timestamp: Date.now() })
    }, 15000)
  }

  const connect = () => {
    if (ws && ws.readyState === WebSocket.OPEN) return

    const host = getWsHost()

    let wsUrl: string
    if (host) {
      wsUrl = `wss://${host}/user/service/info/ws`
    } else {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
      wsUrl = `${proto}//${location.host}/user/service/info/ws`
    }

    ws = new WebSocket(wsUrl)
    ws.binaryType = 'arraybuffer'

    ws.onopen = () => {
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
      reconnectAttempts = 0
      startHeartbeat()
      set({ connected: true })

      while (sendQueue.length > 0) {
        const queued = sendQueue.shift()!
        const result = sendMsg(queued.cmd, queued.data, queued.waitReply, queued.timeout)
        if (queued.resolve && result instanceof Promise) {
          result.then(queued.resolve).catch(queued.reject || (() => {}))
        } else if (queued.resolve) {
          queued.resolve(result)
        }
      }
    }

    ws.onmessage = (ev) => {
      const buf = ev.data as ArrayBuffer
      const view = new DataView(buf)
      const cmd = view.getUint32(4)
      const len = view.getUint32(8)
      const bytes = new Uint8Array(buf, 12, len)
      const text = new TextDecoder().decode(bytes)

      for (const [key, p] of pending.entries()) {
        if (key.startsWith(cmd + '-')) {
          clearTimeout(p.timeoutId)
          p.resolve(text ? JSON.parse(text) : null)
          pending.delete(key)
          break
        }
      }

      const parsed = JSON.parse(text) as WsMessage | WsMessage[]
      const items: WsMessage[] = Array.isArray(parsed) ? parsed : [parsed]
      const type = items[0]?.type
      if (type) {
        const isSystem = type === 'system'
        set((state) => ({
          messageMap: {
            ...state.messageMap,
            [type]: isSystem ? items : [...(state.messageMap[type] || []), ...items].slice(-10),
          },
        }))
      }
    }

    ws.onclose = () => {
      set({ connected: false })
      if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null }

      for (const p of pending.values()) {
        clearTimeout(p.timeoutId)
        p.reject(new Error('ws closed'))
      }
      pending.clear()

      const connecting = ws != null && ws.readyState === WebSocket.CONNECTING
      if (
        !reconnectTimer &&
        !connecting &&
        document.visibilityState === 'visible' &&
        reconnectAttempts < RECONNECT_MAX_ATTEMPTS
      ) {
        const backoff = Math.min(RECONNECT_BASE_MS * Math.pow(2, reconnectAttempts), RECONNECT_CAP_MS)
        const delay = backoff + Math.random() * 1000
        reconnectAttempts += 1
        reconnectTimer = setTimeout(() => { reconnectTimer = null; connect() }, delay)
      }
    }

    ws.onerror = () => { ws?.close() }
  }

  const sendMsg = async (cmd: number, data?: unknown, waitReply = false, timeout = 3000): Promise<unknown> => {
    if (ws?.readyState !== WebSocket.OPEN) {
      if (waitReply) {
        return new Promise((resolve, reject) => {
          sendQueue.push({ cmd, data, waitReply, timeout, resolve, reject })
        })
      }
      sendQueue.push({ cmd, data, waitReply, timeout })
      return null
    }
    const payload = data ? JSON.stringify(data) : ''
    const encoded = new TextEncoder().encode(payload)
    const buf = new ArrayBuffer(12 + encoded.length)
    const view = new DataView(buf)
    view.setUint8(0, 68)
    view.setUint8(1, 105)
    view.setUint8(2, 121)
    view.setUint8(3, 97)
    view.setUint32(4, cmd, false)
    view.setUint32(8, encoded.length, false)
    if (encoded.length > 0) new Uint8Array(buf, 12).set(encoded)

    if (waitReply) {
      return new Promise((resolve, reject) => {
        const key = `${cmd}-${seqId++}`
        let attempts = 0
        const retry = () => {
          if (ws?.readyState !== WebSocket.OPEN) return reject(new Error('WebSocket not connected'))
          ws.send(buf)
          const tid = setTimeout(() => {
            pending.delete(key)
            attempts += 1
            if (attempts >= WAIT_REPLY_MAX_RETRIES) {
              reject(new Error('ws timeout'))
              return
            }
            setTimeout(retry, WAIT_REPLY_BACKOFF_MS)
          }, timeout)
          pending.set(key, { resolve, reject, timeoutId: tid })
        }
        retry()
      })
    }
    ws.send(buf)
    return null
  }

  return {
    connected: false,
    messageMap: {},
    lastSystemMessageIndex: 0,
    setLastSystemMessageIndex: (i) => set({ lastSystemMessageIndex: i }),
    setMessageMap: (patch) => set((state) => ({ messageMap: { ...state.messageMap, ...patch } })),
    shiftMessageByType: (type) => {
      let first: WsMessage | null = null
      set((state) => {
        const arr = state.messageMap[type]
        if (arr && arr.length > 0) {
          const [head, ...rest] = arr
          first = head
          return { messageMap: { ...state.messageMap, [type]: rest } }
        }
        return state
      })
      return first
    },
    clearMessageByType: (type) => set((state) => ({ messageMap: { ...state.messageMap, [type]: [] } })),
    connect,
    close: () => { ws?.close() },
    send: sendMsg,
  }
})
