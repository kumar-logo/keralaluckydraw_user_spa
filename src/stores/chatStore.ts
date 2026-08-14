import { create } from 'zustand'
import { useAppConfigStore } from './configStore'
import {
  getChatGroups,
  getChatHistory,
  getChatAfter,
  sendChatMessage,
  markChatRead,
  type ChatGroup,
  type ChatMessage,
  type SendPayload,
} from '../services/chatApi'

const HISTORY_PAGE = 30
const MESSAGE_WINDOW = 300
const UNREAD_KEY = 'chat_unread'
const TYPING_TTL = 3500
const AFTER_PAGE = 50
const SYNC_MAX_PAGES = 20
const READ_DEBOUNCE_MS = 1200

const loadUnread = (): Record<number, number> => {
  try {
    const raw = localStorage.getItem(UNREAD_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, number>
    const out: Record<number, number> = {}
    for (const key of Object.keys(parsed)) out[Number(key)] = parsed[key]
    return out
  } catch {
    return {}
  }
}

const saveUnread = (unread: Record<number, number>): void => {
  try {
    localStorage.setItem(UNREAD_KEY, JSON.stringify(unread))
  } catch {
    return
  }
}

const mergeAscending = (existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] => {
  const byId = new Map<number, ChatMessage>()
  for (const m of existing) byId.set(m.id, m)
  for (const m of incoming) byId.set(m.id, m)
  return Array.from(byId.values()).sort((a, b) => a.id - b.id)
}

const capTail = (list: ChatMessage[]): ChatMessage[] =>
  list.length > MESSAGE_WINDOW ? list.slice(list.length - MESSAGE_WINDOW) : list

const appendLive = (list: ChatMessage[], msg: ChatMessage): ChatMessage[] => {
  if (list.length === 0) return [msg]
  const last = list[list.length - 1]
  if (msg.id > last.id) return capTail(list.concat(msg))
  if (list.some((m) => m.id === msg.id)) return list
  return capTail(mergeAscending(list, [msg]))
}

const typingTimers = new Map<number, ReturnType<typeof setTimeout>>()
const readDebounceTimers = new Map<number, ReturnType<typeof setTimeout>>()
const readPending = new Map<number, number>()

interface ChatState {
  open: boolean
  inRoom: boolean
  groups: ChatGroup[]
  groupsLoaded: boolean
  activeGroupId: number | null
  messagesByGroup: Record<number, ChatMessage[]>
  hasMoreByGroup: Record<number, boolean>
  loadingHistory: boolean
  loadingMore: boolean
  sending: boolean
  unread: Record<number, number>
  typing: Record<number, string>
  reads: Record<number, Record<string, number>>
  reply: ChatMessage | null
  lastMarkedRead: Record<number, number>
  myUserId: string | null

  setMyUserId: (id: string | null) => void
  openPanel: () => void
  closePanel: () => void
  loadGroups: () => Promise<void>
  enterRoom: (groupId: number) => Promise<void>
  backToList: () => void
  loadMore: () => Promise<void>
  syncActiveGroup: () => Promise<void>
  send: (payload: SendPayload) => Promise<boolean>
  setReply: (msg: ChatMessage | null) => void
  receiveMessage: (msg: ChatMessage) => void
  removeMessage: (id: number, groupId: number) => void
  clearGroup: (groupId: number) => void
  receiveTyping: (groupId: number, name: string) => void
  receiveRead: (groupId: number, userId: string, lastReadId: number) => void
  markReadUpTo: (groupId: number, messageId: number) => void
  markRead: (groupId: number) => void
  reset: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  open: false,
  inRoom: false,
  groups: [],
  groupsLoaded: false,
  activeGroupId: null,
  messagesByGroup: {},
  hasMoreByGroup: {},
  loadingHistory: false,
  loadingMore: false,
  sending: false,
  unread: loadUnread(),
  typing: {},
  reads: {},
  reply: null,
  lastMarkedRead: {},
  myUserId: null,

  setMyUserId: (id) => set({ myUserId: id }),

  openPanel: () => {
    set({ open: true })
    void useAppConfigStore.getState().refreshGroupChat()
    if (!get().groupsLoaded) {
      void get().loadGroups()
      return
    }
    const { groups, inRoom, activeGroupId } = get()
    if (groups.length === 1) {
      void get().enterRoom(groups[0].id)
    } else if (inRoom && activeGroupId !== null) {
      get().markRead(activeGroupId)
    }
  },

  closePanel: () => set({ open: false, inRoom: false, reply: null }),

  loadGroups: async () => {
    try {
      const groups = await getChatGroups()
      const unread: Record<number, number> = {}
      for (const g of groups) unread[g.id] = g.unread
      set({ groups, groupsLoaded: true, unread })
      saveUnread(unread)
      if (get().open && groups.length === 1 && !get().inRoom) {
        void get().enterRoom(groups[0].id)
      }
    } catch {
      set({ groupsLoaded: true })
    }
  },

  enterRoom: async (groupId) => {
    set((state) => {
      const kept = state.messagesByGroup[groupId]
      return {
        activeGroupId: groupId,
        inRoom: true,
        reply: null,
        messagesByGroup: kept ? { [groupId]: kept } : {},
        hasMoreByGroup:
          state.hasMoreByGroup[groupId] === undefined
            ? {}
            : { [groupId]: state.hasMoreByGroup[groupId] },
      }
    })
    get().markRead(groupId)
    const cached = get().messagesByGroup[groupId]
    if (cached) {
      if (cached.length > 0) get().markReadUpTo(groupId, cached[cached.length - 1].id)
      return
    }
    set({ loadingHistory: true })
    try {
      const rows = await getChatHistory(groupId, undefined, HISTORY_PAGE)
      set((state) => ({
        messagesByGroup: { ...state.messagesByGroup, [groupId]: rows },
        hasMoreByGroup: { ...state.hasMoreByGroup, [groupId]: rows.length >= HISTORY_PAGE },
        loadingHistory: false,
      }))
      if (rows.length > 0) get().markReadUpTo(groupId, rows[rows.length - 1].id)
    } catch {
      set({ loadingHistory: false })
    }
  },

  backToList: () => set({ inRoom: false, reply: null }),

  loadMore: async () => {
    const { activeGroupId, messagesByGroup, hasMoreByGroup, loadingMore } = get()
    if (activeGroupId === null || loadingMore) return
    if (hasMoreByGroup[activeGroupId] === false) return
    const current = messagesByGroup[activeGroupId]
    if (!current || current.length === 0) return
    set({ loadingMore: true })
    try {
      const rows = await getChatHistory(activeGroupId, current[0].id, HISTORY_PAGE)
      set((state) => ({
        messagesByGroup: {
          ...state.messagesByGroup,
          [activeGroupId]: mergeAscending(state.messagesByGroup[activeGroupId] ?? [], rows),
        },
        hasMoreByGroup: { ...state.hasMoreByGroup, [activeGroupId]: rows.length >= HISTORY_PAGE },
        loadingMore: false,
      }))
    } catch {
      set({ loadingMore: false })
    }
  },

  syncActiveGroup: async () => {
    const { activeGroupId, messagesByGroup } = get()
    if (activeGroupId === null) return
    const current = messagesByGroup[activeGroupId]
    if (!current || current.length === 0) return
    const startId = current[current.length - 1].id
    let cursor = startId
    try {
      for (let page = 0; page < SYNC_MAX_PAGES; page++) {
        const rows = await getChatAfter(activeGroupId, cursor)
        if (rows.length === 0) break
        set((state) => ({
          messagesByGroup: {
            ...state.messagesByGroup,
            [activeGroupId]: capTail(
              mergeAscending(state.messagesByGroup[activeGroupId] ?? [], rows),
            ),
          },
        }))
        cursor = rows[rows.length - 1].id
        if (rows.length < AFTER_PAGE) break
      }
      if (get().inRoom && cursor > startId) get().markReadUpTo(activeGroupId, cursor)
    } catch {
      return
    }
  },

  send: async (payload) => {
    const { activeGroupId, sending } = get()
    const content = payload.content.trim()
    const hasImage = typeof payload.imageUrl === 'string' && payload.imageUrl !== ''
    if (activeGroupId === null || sending || (content === '' && !hasImage)) return false
    set({ sending: true })
    try {
      const msg = await sendChatMessage(activeGroupId, { ...payload, content })
      get().receiveMessage(msg)
      set({ sending: false, reply: null })
      return true
    } catch {
      set({ sending: false })
      void useAppConfigStore.getState().refreshGroupChat()
      return false
    }
  },

  setReply: (msg) => set({ reply: msg }),

  receiveMessage: (msg) => {
    set((state) => {
      const existing = state.messagesByGroup[msg.groupId]
      const nextMessages = existing
        ? { ...state.messagesByGroup, [msg.groupId]: appendLive(existing, msg) }
        : state.messagesByGroup
      const typing = { ...state.typing }
      delete typing[msg.groupId]
      const isReading = state.open && state.inRoom && state.activeGroupId === msg.groupId
      const isOwn = msg.senderRole === 'user' && msg.userId === state.myUserId
      if (isReading || isOwn) return { messagesByGroup: nextMessages, typing }
      const unread = { ...state.unread, [msg.groupId]: (state.unread[msg.groupId] ?? 0) + 1 }
      saveUnread(unread)
      return { messagesByGroup: nextMessages, unread, typing }
    })
    const s = get()
    if (s.open && s.inRoom && s.activeGroupId === msg.groupId) {
      s.markReadUpTo(msg.groupId, msg.id)
    }
  },

  removeMessage: (id, groupId) => {
    set((state) => {
      const existing = state.messagesByGroup[groupId]
      if (!existing) return state
      const filtered = existing.filter((m) => m.id !== id)
      const messagesByGroup = { ...state.messagesByGroup, [groupId]: filtered }
      const isReading = state.open && state.inRoom && state.activeGroupId === groupId
      const wasUnread = id > (state.lastMarkedRead[groupId] ?? 0)
      if (isReading || !wasUnread || !state.unread[groupId]) {
        return { messagesByGroup }
      }
      const unread = {
        ...state.unread,
        [groupId]: Math.max(0, state.unread[groupId] - 1),
      }
      saveUnread(unread)
      return { messagesByGroup, unread }
    })
  },

  clearGroup: (groupId) => {
    set((state) => {
      const unread = { ...state.unread, [groupId]: 0 }
      saveUnread(unread)
      return {
        messagesByGroup: { ...state.messagesByGroup, [groupId]: [] },
        hasMoreByGroup: { ...state.hasMoreByGroup, [groupId]: false },
        unread,
        lastMarkedRead: { ...state.lastMarkedRead, [groupId]: 0 },
      }
    })
  },

  receiveTyping: (groupId, name) => {
    set((state) => ({ typing: { ...state.typing, [groupId]: name } }))
    const prev = typingTimers.get(groupId)
    if (prev) clearTimeout(prev)
    typingTimers.set(
      groupId,
      setTimeout(() => {
        set((state) => {
          const typing = { ...state.typing }
          delete typing[groupId]
          return { typing }
        })
        typingTimers.delete(groupId)
      }, TYPING_TTL),
    )
  },

  receiveRead: (groupId, userId, lastReadId) => {
    set((state) => {
      const group = state.reads[groupId] ?? {}
      const prev = group[userId] ?? 0
      if (lastReadId <= prev) return state
      return { reads: { ...state.reads, [groupId]: { ...group, [userId]: lastReadId } } }
    })
  },

  markReadUpTo: (groupId, messageId) => {
    const prev = get().lastMarkedRead[groupId] ?? 0
    if (messageId <= prev) return
    set((state) => {
      const unread = { ...state.unread, [groupId]: 0 }
      saveUnread(unread)
      return {
        unread,
        lastMarkedRead: { ...state.lastMarkedRead, [groupId]: messageId },
      }
    })
    readPending.set(groupId, Math.max(readPending.get(groupId) ?? 0, messageId))
    if (readDebounceTimers.has(groupId)) return
    readDebounceTimers.set(
      groupId,
      setTimeout(() => {
        const id = readPending.get(groupId) ?? 0
        readDebounceTimers.delete(groupId)
        readPending.delete(groupId)
        if (id > 0) void markChatRead(groupId, id)
      }, READ_DEBOUNCE_MS),
    )
  },

  markRead: (groupId) => {
    set((state) => {
      if (!state.unread[groupId]) return state
      const unread = { ...state.unread, [groupId]: 0 }
      saveUnread(unread)
      return { unread }
    })
  },

  reset: () => {
    saveUnread({})
    set({
      open: false,
      inRoom: false,
      groups: [],
      groupsLoaded: false,
      activeGroupId: null,
      messagesByGroup: {},
      hasMoreByGroup: {},
      unread: {},
      typing: {},
      reads: {},
      reply: null,
      lastMarkedRead: {},
    })
  },
}))

export const useTotalUnread = (): number =>
  useChatStore((s) => Object.values(s.unread).reduce((sum, n) => sum + n, 0))
