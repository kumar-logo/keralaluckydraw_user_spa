import { apiGet, apiPost } from './api'
import { getApiBaseUrl } from '../config/env'
import { useAuthStore } from '../stores/authStore'

export interface ReplySnippet {
  id: number
  senderName: string
  content: string
  imageUrl: string | null
  kind: string
  audioUrl: string | null
  durationMs: number | null
  audioWaveform: string | null
}

export interface ChatMessage {
  id: number
  groupId: number
  userId: string
  senderRole: string
  senderName: string
  senderAvatar: string
  kind: string
  content: string
  imageUrl: string | null
  audioUrl: string | null
  durationMs: number | null
  audioWaveform: string | null
  replyToId: number | null
  replyTo: ReplySnippet | null
  mentions: string[]
  createdAt: string
  pending?: boolean
}

export interface ChatLastMessage {
  content: string
  imageUrl: string | null
  senderName: string
  createdAt: string
  kind: string
}

export interface ChatPeer {
  kind: string
  id: string | null
  name: string
  avatar: string
}

export interface ChatGroup {
  id: number
  name: string
  type: string
  avatar: string
  description: string
  joinPolicy: string
  postPolicy: string
  visibility: string
  memberCount: number
  isDm: boolean
  joined: boolean
  unread: number
  unreadMentions: number
  lastMessage: ChatLastMessage | null
}

export interface ChatDm {
  id: number
  dmKey: string | null
  isDm: true
  claimed: boolean
  peer: ChatPeer
  unread: number
  lastMessage: ChatLastMessage | null
}

export interface DiscoverGroup {
  id: number
  name: string
  avatar: string
  description: string
  memberCount: number
  joinPolicy: string
  postPolicy: string
  joined: boolean
}

export interface DiscoverResult {
  items: DiscoverGroup[]
  nextCursor: string | null
}

export interface DmListResult {
  items: ChatDm[]
  nextCursor: string | null
}

export interface ChatMentionItem {
  mentionId: number
  groupId: number
  messageId: number
  groupName: string
  senderName: string
  kind: string
  preview: string
  createdAt: string
  unread: boolean
}

export interface DmReceipts {
  peerDeliveredId: number
  peerReadId: number
}

export interface ChatMuteState {
  muted: boolean
  mutedUntil: string | null
  reason: string
}

export interface ChatGroupsResult {
  groups: ChatGroup[]
  mute: ChatMuteState
}

export interface ChatUnread {
  groupId: number
  unread: number
}

export interface ChatReader {
  userId: string
  nickname: string
  avatar: string
}

export interface ChatReaders {
  count: number
  total: number
  readers: ChatReader[]
}

export interface SendPayload {
  content: string
  imageUrl?: string
  replyToId?: number
  mentions?: string[]
  kind?: string
  audioUrl?: string
  durationMs?: number
  audioWaveform?: string
}

export const chatMediaUrl = (path: string): string => {
  if (path.startsWith('blob:') || path.startsWith('data:')) return path
  const base = getApiBaseUrl()
  return base && base !== '/' ? `${base}${path}` : path
}

export const getChatGroups = () =>
  apiGet<ChatGroupsResult>('/hall/api/chat/v1/groups')

export const getChatUnread = () =>
  apiGet<ChatUnread[]>('/hall/api/chat/v1/unread')

export const getDiscoverGroups = (cursor: string | undefined, limit: number) =>
  apiGet<DiscoverResult>('/hall/api/chat/v1/discover', { params: { cursor, limit } })

export const getUserDms = (cursor: string | undefined) =>
  apiGet<DmListResult>('/hall/api/chat/v1/dms', { params: { cursor } })

export const getMentions = () =>
  apiGet<ChatMentionItem[]>('/hall/api/chat/v1/mentions')

export const getDmReceipts = (groupId: number) =>
  apiGet<DmReceipts>(`/hall/api/chat/v1/dm/${groupId}/receipts`)

export const getChatHistory = (groupId: number, beforeId: number | undefined, limit: number) =>
  apiPost<ChatMessage[]>('/hall/api/chat/v1/history', { groupId, beforeId, limit })

export const getChatAfter = (groupId: number, afterId: number) =>
  apiPost<ChatMessage[]>('/hall/api/chat/v1/after', { groupId, afterId })

export const markChatRead = (groupId: number, messageId: number) =>
  apiPost<{ success: boolean }>('/hall/api/chat/v1/read', { groupId, messageId })

export const markDelivered = (groupId: number, messageId: number) =>
  apiPost<{ success: boolean }>('/hall/api/chat/v1/delivered', { groupId, messageId })

export const getChatReaders = (groupId: number, messageId: number) =>
  apiPost<ChatReaders>('/hall/api/chat/v1/readers', { groupId, messageId })

export const joinGroup = (groupId: number) =>
  apiPost<{ success: boolean; joined: boolean }>('/hall/api/chat/v1/join', { groupId })

export const leaveGroup = (groupId: number) =>
  apiPost<{ success: boolean }>('/hall/api/chat/v1/leave', { groupId })

export const openSupportDm = () =>
  apiPost<ChatDm>('/hall/api/chat/v1/dm/open', {})

export const sendChatMessage = (groupId: number, payload: SendPayload) =>
  apiPost<ChatMessage>('/hall/api/chat/v1/send', { groupId, ...payload })

export const uploadChatImage = async (file: File): Promise<{ url: string }> => {
  const form = new FormData()
  form.append('file', file)
  const token = useAuthStore.getState().token ?? localStorage.getItem('token') ?? ''
  const base = getApiBaseUrl()
  const origin = base && base !== '/' ? base : ''
  const res = await fetch(`${origin}/hall/api/chat/v1/upload`, {
    method: 'POST',
    headers: { Token: token },
    body: form,
  })
  const json = (await res.json()) as { code: number; msg?: string; data: { url: string } }
  if (json.code !== 0) {
    throw new Error(typeof json.msg === 'string' ? json.msg : 'Upload failed')
  }
  return json.data
}

export const uploadChatAudio = async (
  blob: Blob,
  durationMs: number,
  waveform: string,
): Promise<{ url: string }> => {
  const baseType = blob.type.split(';')[0]
  const mime = baseType !== '' ? baseType : 'audio/webm'
  const ext = mime === 'audio/mp4' ? 'm4a' : mime === 'audio/mpeg' ? 'mp3' : mime === 'audio/ogg' ? 'ogg' : 'webm'
  const file = new File([blob], `voice.${ext}`, { type: mime })
  const form = new FormData()
  form.append('file', file)
  form.append('durationMs', String(durationMs))
  form.append('waveform', waveform)
  const token = useAuthStore.getState().token ?? localStorage.getItem('token') ?? ''
  const base = getApiBaseUrl()
  const origin = base && base !== '/' ? base : ''
  const res = await fetch(`${origin}/hall/api/chat/v1/voice`, {
    method: 'POST',
    headers: { Token: token },
    body: form,
  })
  const json = (await res.json()) as { code: number; msg?: string; data: { url: string } }
  if (json.code !== 0) {
    throw new Error(typeof json.msg === 'string' ? json.msg : 'Upload failed')
  }
  return json.data
}
