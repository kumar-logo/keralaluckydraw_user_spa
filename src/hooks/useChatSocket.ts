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

interface DeliveredPayload {
  groupId: number
  userId: string
  lastDeliveredId: number
}

interface MentionPayload {
  groupId: number
  groupName: string
  messageId: number
  senderName: string
  preview: string
}

interface MentionBadgePayload {
  groupId: number
}

interface GroupUpdatePayload {
  groupId: number
  name: string
  avatar: string
  description: string
  type: string
  joinPolicy: string
  postPolicy: string
  visibility: string
}

interface JoinedPayload {
  groupId: number
  userId: string
}

interface LeftPayload {
  groupId: number
  userId: string
}

interface DmCreatedPayload {
  groupId: number
  dmKey: string
  userId: string
  scope: string
}

interface MuteStatePayload {
  muted: boolean
  mutedUntil: string | null
  reason: string
}

const MUTED_MESSAGE = 'You are muted in the chat'
const UNMUTED_MESSAGE = 'You can send messages in the chat again'

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

const handleDelivered = (payload: DeliveredPayload): void => {
  if (!payload || !payload.groupId) return
  useChatStore.getState().receiveDelivered(payload.groupId, payload.userId, payload.lastDeliveredId)
}

const handleMention = (payload: MentionPayload): void => {
  if (!payload || !payload.senderName) return
  toast.success(`${payload.senderName} mentioned you in ${payload.groupName}`)
}

const handleMentionBadge = (payload: MentionBadgePayload): void => {
  if (!payload || !payload.groupId) return
  useChatStore.getState().receiveMentionBadge(payload.groupId)
}

const handleGroupUpdate = (payload: GroupUpdatePayload): void => {
  if (!payload || !payload.groupId) return
  useChatStore.getState().handleGroupUpdate(payload)
}

const handleJoined = (payload: JoinedPayload): void => {
  if (!payload || !payload.groupId) return
  useChatStore.getState().handleJoined(payload.groupId, payload.userId)
}

const handleLeft = (payload: LeftPayload): void => {
  if (!payload || !payload.groupId) return
  useChatStore.getState().handleLeft(payload.groupId, payload.userId)
}

const handleDmCreated = (payload: DmCreatedPayload): void => {
  if (!payload || !payload.groupId) return
  useChatStore.getState().handleDmCreated(payload.groupId)
}

const handleMuteState = (payload: MuteStatePayload): void => {
  if (!payload || typeof payload.muted !== 'boolean') return
  const wasMuted = useChatStore.getState().muted
  useChatStore.getState().applyMuteState(payload)
  const isMuted = useChatStore.getState().muted
  if (isMuted === wasMuted) return
  if (isMuted) {
    toast.warning(payload.reason === '' ? MUTED_MESSAGE : `${MUTED_MESSAGE}: ${payload.reason}`)
    return
  }
  toast.success(UNMUTED_MESSAGE)
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

const currentRoomIds = (): number[] => {
  const state = useChatStore.getState()
  return state.groups.map((g) => g.id).concat(state.dms.map((d) => d.id))
}

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
    socket.on('chat:delivered', handleDelivered)
    socket.on('chat:mention', handleMention)
    socket.on('chat:mention_badge', handleMentionBadge)
    socket.on('chat:group_update', handleGroupUpdate)
    socket.on('chat:joined', handleJoined)
    socket.on('chat:left', handleLeft)
    socket.on('chat:dm_created', handleDmCreated)
    socket.on('chat:mute_state', handleMuteState)
    socket.on('connect', () => {
      subscribed.clear()
      subscribeRooms(currentRoomIds())
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
  const roomIdsKey = useChatStore((s) =>
    s.groups.map((g) => g.id).concat(s.dms.map((d) => d.id)).join(','),
  )

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
    if (!token || !enabled || roomIdsKey === '') return
    subscribeRooms(currentRoomIds())
  }, [token, enabled, roomIdsKey])

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
