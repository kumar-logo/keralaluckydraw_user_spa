import { useEffect } from 'react'
import { type Socket } from 'socket.io-client'
import { getApiBaseUrl } from '../config/env'
import { useAuthStore } from '../stores/authStore'
import { useAppConfigStore } from '../stores/configStore'
import { useChatStore } from '../stores/chatStore'
import { toast } from '../utils/toast'
import { decodeJwtUserId } from '../utils/jwt'
import type { ChatMessage } from '../services/chatApi'

interface TypingPayload {
  groupId: number
  userId: string
  isAdmin: boolean
}

interface ReadPayload {
  groupId: number
  userId: string
  lastReadId: number
}

interface MentionPayload {
  groupId: number
  groupName: string
  messageId: number
  senderName: string
  preview: string
}

let socket: Socket | null = null
let connecting = false
const subscribed = new Set<number>()

const disconnect = (): void => {
  socket?.disconnect()
  socket = null
  connecting = false
  subscribed.clear()
}

const handleNew = (msg: ChatMessage): void => {
  if (!msg || msg.id == null) return
  useChatStore.getState().receiveMessage(msg)
}

const handleDelete = (payload: { id: number; groupId: number }): void => {
  if (!payload || payload.id == null) return
  useChatStore.getState().removeMessage(payload.id, payload.groupId)
}

const handleCleared = (payload: { groupId: number }): void => {
  if (!payload || payload.groupId == null) return
  useChatStore.getState().clearGroup(payload.groupId)
}

const resolveTypingName = (
  groupId: number,
  userId: string,
  isAdmin: boolean,
): string => {
  const msgs = useChatStore.getState().messagesByGroup[groupId]
  if (msgs) {
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].userId === userId && msgs[i].senderName !== '') {
        return msgs[i].senderName
      }
    }
  }
  return isAdmin ? 'Admin' : 'Someone'
}

const handleTyping = (payload: TypingPayload): void => {
  if (!payload || !payload.groupId) return
  const name = resolveTypingName(payload.groupId, payload.userId, payload.isAdmin)
  useChatStore.getState().receiveTyping(payload.groupId, name)
}

const handleRead = (payload: ReadPayload): void => {
  if (!payload || !payload.groupId) return
  useChatStore.getState().receiveRead(payload.groupId, payload.userId, payload.lastReadId)
}

const handleMention = (payload: MentionPayload): void => {
  if (!payload || !payload.senderName) return
  toast.success(`${payload.senderName} mentioned you in ${payload.groupName}`)
}

export const emitChatTyping = (groupId: number): void => {
  if (socket && socket.connected) socket.emit('chat:typing', { groupId })
}

const subscribeRooms = (ids: number[]): void => {
  if (!socket || !socket.connected) return
  for (const id of ids) {
    if (subscribed.has(id)) continue
    socket.emit('chat:subscribe', { groupId: id })
    subscribed.add(id)
  }
}

const currentGroupIds = (): number[] =>
  useChatStore.getState().groups.map((g) => g.id)

const connect = async (token: string): Promise<void> => {
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
      auth: (cb) => cb({ token: token || undefined }),
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
    })
    socket.on('chat:new', handleNew)
    socket.on('chat:delete', handleDelete)
    socket.on('chat:cleared', handleCleared)
    socket.on('chat:typing', handleTyping)
    socket.on('chat:read', handleRead)
    socket.on('chat:mention', handleMention)
    socket.on('connect', () => {
      subscribed.clear()
      subscribeRooms(currentGroupIds())
      void useChatStore.getState().syncActiveGroup()
    })
  } catch {
    connecting = false
  } finally {
    connecting = false
  }
}

export const useChatSocket = (): void => {
  const token = useAuthStore((s) => s.token)
  const enabled = useAppConfigStore((s) => s.groupChatEnabled)
  const groupIdsKey = useChatStore((s) => s.groups.map((g) => g.id).join(','))

  useEffect(() => {
    if (!token || !enabled) {
      useChatStore.getState().setMyUserId(null)
      disconnect()
      return
    }
    useChatStore.getState().setMyUserId(decodeJwtUserId(token))
    void connect(token)
    return () => {
      disconnect()
    }
  }, [token, enabled])

  useEffect(() => {
    if (!token || !enabled || groupIdsKey === '') return
    subscribeRooms(currentGroupIds())
  }, [token, enabled, groupIdsKey])

  useEffect(() => {
    if (!token || !enabled) return
    const revive = () => {
      if (document.visibilityState === 'visible' && socket && !socket.connected) {
        socket.connect()
      }
    }
    window.addEventListener('visibilitychange', revive)
    window.addEventListener('online', revive)
    return () => {
      window.removeEventListener('visibilitychange', revive)
      window.removeEventListener('online', revive)
    }
  }, [token, enabled])
}
