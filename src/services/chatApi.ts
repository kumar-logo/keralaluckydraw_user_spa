import { apiGet, apiPost } from './api'
import { getApiBaseUrl } from '../config/env'
import { useAuthStore } from '../stores/authStore'

export interface ReplySnippet {
  id: number
  senderName: string
  content: string
  imageUrl: string | null
}

export interface ChatMessage {
  id: number
  groupId: number
  userId: string
  senderRole: string
  senderName: string
  senderAvatar: string
  content: string
  imageUrl: string | null
  replyToId: number | null
  replyTo: ReplySnippet | null
  mentions: string[]
  createdAt: string
}

export interface ChatLastMessage {
  content: string
  imageUrl: string | null
  senderName: string
  createdAt: string
}

export interface ChatGroup {
  id: number
  name: string
  type: string
  avatar: string
  unread: number
  lastMessage: ChatLastMessage | null
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
}

export const chatMediaUrl = (path: string): string => {
  const base = getApiBaseUrl()
  return base && base !== '/' ? `${base}${path}` : path
}

export const getChatGroups = () =>
  apiGet<ChatGroup[]>('/hall/api/chat/v1/groups')

export const getChatUnread = () =>
  apiGet<ChatUnread[]>('/hall/api/chat/v1/unread')

export const getChatHistory = (groupId: number, beforeId: number | undefined, limit: number) =>
  apiPost<ChatMessage[]>('/hall/api/chat/v1/history', { groupId, beforeId, limit })

export const getChatAfter = (groupId: number, afterId: number) =>
  apiPost<ChatMessage[]>('/hall/api/chat/v1/after', { groupId, afterId })

export const markChatRead = (groupId: number, messageId: number) =>
  apiPost<{ success: boolean }>('/hall/api/chat/v1/read', { groupId, messageId })

export const getChatReaders = (groupId: number, messageId: number) =>
  apiPost<ChatReaders>('/hall/api/chat/v1/readers', { groupId, messageId })

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
