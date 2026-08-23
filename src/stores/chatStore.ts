import { create } from 'zustand'
import { useAppConfigStore } from './configStore'
import { toast } from '../utils/toast'
import { MessageKind, SenderRole, GroupType } from '../services/chatTypes'
import {
  getChatGroups,
  getChatHistory,
  getChatAfter,
  sendChatMessage,
  markChatRead,
  markDelivered,
  uploadChatAudio,
  getUserDms,
  getDiscoverGroups,
  joinGroup,
  openSupportDm,
  type ChatGroup,
  type ChatMessage,
  type ChatDm,
  type ChatMuteState,
  type DiscoverGroup,
  type SendPayload,
} from '../services/chatApi'

const HISTORY_PAGE = 30
const DISCOVER_PAGE = 20
const MESSAGE_WINDOW = 300
const UNREAD_KEY = 'chat_unread'
const MENTION_KEY = 'chat_mentions'
const TYPING_TTL = 3500
const AFTER_PAGE = 50
const SYNC_MAX_PAGES = 20
const READ_DEBOUNCE_MS = 1200
const DELIVERED_DEBOUNCE_MS = 1200
const PEER_KEY = '__peer__'
const MAX_TIMEOUT_MS = 2147483647
const SEND_FAILED_MESSAGE = 'Message could not be sent'

interface ApiErrorShape {
  data?: { msg?: string }
  response?: { data?: { msg?: string } }
}

const serverMessage = (err: unknown): string => {
  if (typeof err === 'object' && err !== null) {
    const shaped = err as ApiErrorShape
    const direct = shaped.data === undefined ? undefined : shaped.data.msg
    if (typeof direct === 'string' && direct !== '') return direct
    const nested =
      shaped.response === undefined || shaped.response.data === undefined
        ? undefined
        : shaped.response.data.msg
    if (typeof nested === 'string' && nested !== '') return nested
  }
  if (err instanceof Error && err.message !== '') return err.message
  return ''
}

const reportSendFailure = (err: unknown): void => {
  const message = serverMessage(err)
  toast.warning(message === '' ? SEND_FAILED_MESSAGE : message)
}

let muteExpiryTimer: ReturnType<typeof setTimeout> | undefined

const clearMuteExpiry = (): void => {
  if (muteExpiryTimer === undefined) return
  clearTimeout(muteExpiryTimer)
  muteExpiryTimer = undefined
}

const loadNumberMap = (key: string): Record<number, number> => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, number>
    const out: Record<number, number> = {}
    for (const k of Object.keys(parsed)) out[Number(k)] = parsed[k]
    return out
  } catch {
    return {}
  }
}

const saveNumberMap = (key: string, value: Record<number, number>): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

const loadUnread = (): Record<number, number> => loadNumberMap(UNREAD_KEY)
const saveUnread = (v: Record<number, number>): void => saveNumberMap(UNREAD_KEY, v)
const loadMentions = (): Record<number, number> => loadNumberMap(MENTION_KEY)
const saveMentions = (v: Record<number, number>): void => saveNumberMap(MENTION_KEY, v)

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

const mergeDms = (existing: ChatDm[], incoming: ChatDm[]): ChatDm[] => {
  const byId = new Map<number, ChatDm>()
  for (const d of incoming) byId.set(d.id, d)
  for (const d of existing) if (!byId.has(d.id)) byId.set(d.id, d)
  const seen = new Set<number>()
  const ordered: ChatDm[] = []
  for (const d of incoming.concat(existing)) {
    if (seen.has(d.id)) continue
    seen.add(d.id)
    const row = byId.get(d.id)
    if (row !== undefined) ordered.push(row)
  }
  return ordered
}

const mergeDiscover = (existing: DiscoverGroup[], incoming: DiscoverGroup[]): DiscoverGroup[] => {
  const seen = new Set<number>()
  const out: DiscoverGroup[] = []
  for (const g of existing.concat(incoming)) {
    if (seen.has(g.id)) continue
    seen.add(g.id)
    out.push(g)
  }
  return out
}

const typingTimers = new Map<number, ReturnType<typeof setTimeout>>()
const readDebounceTimers = new Map<number, ReturnType<typeof setTimeout>>()
const readPending = new Map<number, number>()
const deliveredTimers = new Map<number, ReturnType<typeof setTimeout>>()
const deliveredPending = new Map<number, number>()
const deliveredHighwater = new Map<number, number>()

interface GroupUpdate {
  groupId: number
  name: string
  avatar: string
  description: string
  type: string
  joinPolicy: string
  postPolicy: string
  visibility: string
}

interface ChatState {
  open: boolean
  inRoom: boolean
  groups: ChatGroup[]
  groupsLoaded: boolean
  dms: ChatDm[]
  dmsLoaded: boolean
  dmsCursor: string | null
  loadingDms: boolean
  discover: DiscoverGroup[]
  discoverLoaded: boolean
  discoverCursor: string | null
  loadingDiscover: boolean
  joiningId: number | null
  previewId: number | null
  activeGroupId: number | null
  messagesByGroup: Record<number, ChatMessage[]>
  hasMoreByGroup: Record<number, boolean>
  loadingHistory: boolean
  loadingMore: boolean
  sending: boolean
  unread: Record<number, number>
  mentionUnread: Record<number, number>
  typing: Record<number, string>
  reads: Record<number, Record<string, number>>
  deliveries: Record<number, Record<string, number>>
  reply: ChatMessage | null
  lastMarkedRead: Record<number, number>
  myUserId: string | null
  muted: boolean
  mutedUntil: string | null

  setMyUserId: (id: string | null) => void
  applyMuteState: (state: ChatMuteState) => void
  openPanel: () => void
  closePanel: () => void
  loadGroups: () => Promise<void>
  loadDms: (reset: boolean) => Promise<void>
  loadDiscover: (reset: boolean) => Promise<void>
  join: (groupId: number) => Promise<boolean>
  openSupport: () => Promise<number | null>
  previewDiscover: (group: DiscoverGroup) => void
  enterRoom: (groupId: number) => Promise<void>
  backToList: () => void
  loadMore: () => Promise<void>
  syncActiveGroup: () => Promise<void>
  send: (payload: SendPayload) => Promise<boolean>
  sendVoice: (blob: Blob, durationMs: number, waveform: string) => Promise<boolean>
  setReply: (msg: ChatMessage | null) => void
  receiveMessage: (msg: ChatMessage) => void
  removeMessage: (id: number, groupId: number) => void
  clearGroup: (groupId: number) => void
  receiveTyping: (groupId: number, name: string) => void
  receiveRead: (groupId: number, userId: string, lastReadId: number) => void
  receiveDelivered: (groupId: number, userId: string, lastDeliveredId: number) => void
  seedDmReceipts: (groupId: number, deliveredId: number, readId: number) => void
  receiveMentionBadge: (groupId: number) => void
  handleGroupUpdate: (update: GroupUpdate) => void
  handleJoined: (groupId: number, userId: string) => void
  handleLeft: (groupId: number, userId: string) => void
  handleDmCreated: (groupId: number) => void
  markReadUpTo: (groupId: number, messageId: number) => void
  markDeliveredUpTo: (groupId: number, messageId: number) => void
  markRead: (groupId: number) => void
  reset: () => void
}

const receiptsGroup = (state: ChatState, groupId: number): boolean => {
  const g = state.groups.find((x) => x.id === groupId)
  if (g !== undefined) return g.type === GroupType.Private
  return state.dms.some((d) => d.id === groupId)
}

export const useChatStore = create<ChatState>((set, get) => ({
  open: false,
  inRoom: false,
  groups: [],
  groupsLoaded: false,
  dms: [],
  dmsLoaded: false,
  dmsCursor: null,
  loadingDms: false,
  discover: [],
  discoverLoaded: false,
  discoverCursor: null,
  loadingDiscover: false,
  joiningId: null,
  previewId: null,
  activeGroupId: null,
  messagesByGroup: {},
  hasMoreByGroup: {},
  loadingHistory: false,
  loadingMore: false,
  sending: false,
  unread: loadUnread(),
  mentionUnread: loadMentions(),
  typing: {},
  reads: {},
  deliveries: {},
  reply: null,
  lastMarkedRead: {},
  myUserId: null,
  muted: false,
  mutedUntil: null,

  setMyUserId: (id) => set({ myUserId: id }),

  applyMuteState: (state) => {
    clearMuteExpiry()
    if (!state.muted) {
      set({ muted: false, mutedUntil: null })
      return
    }
    if (state.mutedUntil === null) {
      set({ muted: true, mutedUntil: null })
      return
    }
    const expiresAt = Date.parse(state.mutedUntil)
    if (Number.isNaN(expiresAt)) {
      set({ muted: true, mutedUntil: null })
      return
    }
    const remaining = expiresAt - Date.now()
    if (remaining <= 0) {
      set({ muted: false, mutedUntil: null })
      return
    }
    set({ muted: true, mutedUntil: state.mutedUntil })
    if (remaining > MAX_TIMEOUT_MS) return
    muteExpiryTimer = setTimeout(() => {
      muteExpiryTimer = undefined
      set({ muted: false, mutedUntil: null })
    }, remaining)
  },

  openPanel: () => {
    set({ open: true })
    void useAppConfigStore.getState().refreshGroupChat()
    if (!get().dmsLoaded) void get().loadDms(true)
    if (!get().groupsLoaded) {
      void get().loadGroups()
      return
    }
    const { groups, inRoom, activeGroupId } = get()
    if (groups.length === 1 && get().dms.length === 0) {
      void get().enterRoom(groups[0].id)
    } else if (inRoom && activeGroupId !== null) {
      get().markRead(activeGroupId)
    }
  },

  closePanel: () => set({ open: false, inRoom: false, reply: null, previewId: null }),

  loadGroups: async () => {
    try {
      const res = await getChatGroups()
      const groups = res.groups
      get().applyMuteState(res.mute)
      const unread: Record<number, number> = {}
      const mentionUnread: Record<number, number> = { ...get().mentionUnread }
      for (const g of groups) {
        unread[g.id] = g.unread
        mentionUnread[g.id] = g.unreadMentions
      }
      set({ groups, groupsLoaded: true, unread, mentionUnread })
      saveUnread(unread)
      saveMentions(mentionUnread)
      if (get().open && groups.length === 1 && get().dms.length === 0 && !get().inRoom) {
        void get().enterRoom(groups[0].id)
      }
    } catch {
      set({ groupsLoaded: true })
    }
  },

  loadDms: async (reset) => {
    if (get().loadingDms) return
    if (!reset && get().dmsLoaded && get().dmsCursor === null) return
    set({ loadingDms: true })
    try {
      const cursor = reset ? undefined : get().dmsCursor === null ? undefined : get().dmsCursor
      const res = await getUserDms(cursor === null ? undefined : cursor)
      set((state) => {
        const unread = { ...state.unread }
        for (const d of res.items) unread[d.id] = d.unread
        saveUnread(unread)
        return {
          dms: reset ? res.items : mergeDms(state.dms, res.items),
          dmsCursor: res.nextCursor,
          dmsLoaded: true,
          loadingDms: false,
          unread,
        }
      })
    } catch {
      set({ loadingDms: false, dmsLoaded: true })
    }
  },

  loadDiscover: async (reset) => {
    if (get().loadingDiscover) return
    if (!reset && get().discoverLoaded && get().discoverCursor === null) return
    set({ loadingDiscover: true })
    try {
      const cursor = reset ? undefined : get().discoverCursor === null ? undefined : get().discoverCursor
      const res = await getDiscoverGroups(cursor === null ? undefined : cursor, DISCOVER_PAGE)
      set((state) => ({
        discover: reset ? res.items : mergeDiscover(state.discover, res.items),
        discoverCursor: res.nextCursor,
        discoverLoaded: true,
        loadingDiscover: false,
      }))
    } catch {
      set({ loadingDiscover: false, discoverLoaded: true })
    }
  },

  join: async (groupId) => {
    if (get().joiningId !== null) return false
    set({ joiningId: groupId })
    try {
      await joinGroup(groupId)
      await get().loadGroups()
      set((state) => ({
        joiningId: null,
        previewId: state.previewId === groupId ? null : state.previewId,
        discover: state.discover.map((d) => (d.id === groupId ? { ...d, joined: true } : d)),
      }))
      return true
    } catch {
      set({ joiningId: null })
      return false
    }
  },

  openSupport: async () => {
    try {
      const dm = await openSupportDm()
      set((state) => {
        const unread = state.unread[dm.id] === undefined ? { ...state.unread, [dm.id]: dm.unread } : state.unread
        return { dms: mergeDms([dm], state.dms), dmsLoaded: true, unread }
      })
      return dm.id
    } catch {
      return null
    }
  },

  previewDiscover: (group) => {
    set({ activeGroupId: group.id, inRoom: true, previewId: group.id, reply: null })
  },

  enterRoom: async (groupId) => {
    set((state) => {
      const kept = state.messagesByGroup[groupId]
      const mentionUnread = { ...state.mentionUnread, [groupId]: 0 }
      saveMentions(mentionUnread)
      return {
        activeGroupId: groupId,
        inRoom: true,
        reply: null,
        previewId: null,
        mentionUnread,
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

  backToList: () => set({ inRoom: false, reply: null, previewId: null }),

  loadMore: async () => {
    const { activeGroupId, messagesByGroup, hasMoreByGroup, loadingMore, previewId } = get()
    if (activeGroupId === null || loadingMore || previewId === activeGroupId) return
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
    const { activeGroupId, messagesByGroup, previewId } = get()
    if (activeGroupId === null || previewId === activeGroupId) return
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
    } catch (err) {
      set({ sending: false })
      reportSendFailure(err)
      void useAppConfigStore.getState().refreshGroupChat()
      void get().loadGroups()
      return false
    }
  },

  sendVoice: async (blob, durationMs, waveform) => {
    const { activeGroupId, sending, myUserId, reply } = get()
    if (activeGroupId === null || sending) return false
    const tempId = -Date.now()
    const blobUrl = URL.createObjectURL(blob)
    const temp: ChatMessage = {
      id: tempId,
      groupId: activeGroupId,
      userId: myUserId === null ? '' : myUserId,
      senderRole: SenderRole.User,
      senderName: '',
      senderAvatar: '',
      kind: MessageKind.Voice,
      content: '',
      imageUrl: null,
      audioUrl: blobUrl,
      durationMs,
      audioWaveform: waveform,
      replyToId: reply ? reply.id : null,
      replyTo: reply
        ? {
            id: reply.id,
            senderName: reply.senderName,
            content: reply.content,
            imageUrl: reply.imageUrl,
            kind: reply.kind,
            audioUrl: reply.audioUrl,
            durationMs: reply.durationMs,
            audioWaveform: reply.audioWaveform,
          }
        : null,
      mentions: [],
      createdAt: new Date().toISOString(),
      pending: true,
    }
    set((state) => {
      const existing = state.messagesByGroup[activeGroupId]
      if (existing === undefined) return { sending: true }
      return {
        sending: true,
        messagesByGroup: { ...state.messagesByGroup, [activeGroupId]: capTail(existing.concat(temp)) },
      }
    })
    try {
      const uploaded = await uploadChatAudio(blob, durationMs, waveform)
      const msg = await sendChatMessage(activeGroupId, {
        content: '',
        kind: MessageKind.Voice,
        audioUrl: uploaded.url,
        durationMs,
        audioWaveform: waveform,
        replyToId: reply ? reply.id : undefined,
      })
      URL.revokeObjectURL(blobUrl)
      set((state) => {
        const existing = state.messagesByGroup[activeGroupId]
        const base = existing === undefined ? [] : existing.filter((m) => m.id !== tempId)
        return {
          sending: false,
          reply: null,
          messagesByGroup: { ...state.messagesByGroup, [activeGroupId]: appendLive(base, msg) },
        }
      })
      return true
    } catch (err) {
      URL.revokeObjectURL(blobUrl)
      set((state) => {
        const existing = state.messagesByGroup[activeGroupId]
        const base = existing === undefined ? [] : existing.filter((m) => m.id !== tempId)
        return { sending: false, messagesByGroup: { ...state.messagesByGroup, [activeGroupId]: base } }
      })
      reportSendFailure(err)
      void useAppConfigStore.getState().refreshGroupChat()
      void get().loadGroups()
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
      const isOwn = msg.senderRole === SenderRole.User && msg.userId === state.myUserId
      const mentioned =
        !isReading &&
        !isOwn &&
        state.myUserId !== null &&
        msg.mentions.includes(state.myUserId)
      let mentionUnread = state.mentionUnread
      if (mentioned) {
        mentionUnread = { ...state.mentionUnread, [msg.groupId]: (state.mentionUnread[msg.groupId] ?? 0) + 1 }
        saveMentions(mentionUnread)
      }
      if (isReading || isOwn) return { messagesByGroup: nextMessages, typing, mentionUnread }
      const unread = { ...state.unread, [msg.groupId]: (state.unread[msg.groupId] ?? 0) + 1 }
      saveUnread(unread)
      return { messagesByGroup: nextMessages, unread, typing, mentionUnread }
    })
    const s = get()
    if (s.open && s.inRoom && s.activeGroupId === msg.groupId) {
      s.markReadUpTo(msg.groupId, msg.id)
    }
    const isOwn = msg.senderRole === SenderRole.User && msg.userId === s.myUserId
    if (!isOwn && receiptsGroup(s, msg.groupId)) {
      s.markDeliveredUpTo(msg.groupId, msg.id)
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
      const mentionUnread = { ...state.mentionUnread, [groupId]: 0 }
      saveUnread(unread)
      saveMentions(mentionUnread)
      return {
        messagesByGroup: { ...state.messagesByGroup, [groupId]: [] },
        hasMoreByGroup: { ...state.hasMoreByGroup, [groupId]: false },
        unread,
        mentionUnread,
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

  receiveDelivered: (groupId, userId, lastDeliveredId) => {
    set((state) => {
      const group = state.deliveries[groupId] ?? {}
      const prev = group[userId] ?? 0
      if (lastDeliveredId <= prev) return state
      return { deliveries: { ...state.deliveries, [groupId]: { ...group, [userId]: lastDeliveredId } } }
    })
  },

  seedDmReceipts: (groupId, deliveredId, readId) => {
    set((state) => {
      const dGroup = state.deliveries[groupId] ?? {}
      const rGroup = state.reads[groupId] ?? {}
      const nextD = deliveredId > (dGroup[PEER_KEY] ?? 0) ? { ...dGroup, [PEER_KEY]: deliveredId } : dGroup
      const nextR = readId > (rGroup[PEER_KEY] ?? 0) ? { ...rGroup, [PEER_KEY]: readId } : rGroup
      return {
        deliveries: { ...state.deliveries, [groupId]: nextD },
        reads: { ...state.reads, [groupId]: nextR },
      }
    })
  },

  receiveMentionBadge: (groupId) => {
    set((state) => {
      const isReading = state.open && state.inRoom && state.activeGroupId === groupId
      if (isReading) return state
      const current = state.mentionUnread[groupId] ?? 0
      if (current >= 1) return state
      const mentionUnread = { ...state.mentionUnread, [groupId]: 1 }
      saveMentions(mentionUnread)
      return { mentionUnread }
    })
  },

  handleGroupUpdate: (update) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === update.groupId
          ? {
              ...g,
              name: update.name,
              avatar: update.avatar,
              description: update.description,
              type: update.type,
              joinPolicy: update.joinPolicy,
              postPolicy: update.postPolicy,
              visibility: update.visibility,
            }
          : g,
      ),
    }))
  },

  handleJoined: (groupId, userId) => {
    if (userId === get().myUserId) {
      set((state) => ({ previewId: state.previewId === groupId ? null : state.previewId }))
      void get().loadGroups()
      return
    }
    set((state) => ({
      groups: state.groups.map((g) => (g.id === groupId ? { ...g, memberCount: g.memberCount + 1 } : g)),
      discover: state.discover.map((d) => (d.id === groupId ? { ...d, memberCount: d.memberCount + 1 } : d)),
    }))
  },

  handleLeft: (groupId, userId) => {
    if (userId === get().myUserId) {
      set((state) => {
        const leavingActive = state.activeGroupId === groupId
        return {
          groups: state.groups.filter((g) => g.id !== groupId),
          inRoom: leavingActive ? false : state.inRoom,
          activeGroupId: leavingActive ? null : state.activeGroupId,
        }
      })
      return
    }
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, memberCount: Math.max(0, g.memberCount - 1) } : g,
      ),
      discover: state.discover.map((d) =>
        d.id === groupId ? { ...d, memberCount: Math.max(0, d.memberCount - 1) } : d,
      ),
    }))
  },

  handleDmCreated: (groupId) => {
    void groupId
    void get().loadDms(true)
  },

  markReadUpTo: (groupId, messageId) => {
    const prev = get().lastMarkedRead[groupId] ?? 0
    if (messageId <= prev) return
    set((state) => {
      const unread = { ...state.unread, [groupId]: 0 }
      const mentionUnread = { ...state.mentionUnread, [groupId]: 0 }
      saveUnread(unread)
      saveMentions(mentionUnread)
      return {
        unread,
        mentionUnread,
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
        if (id > 0) void markChatRead(groupId, id).catch(() => undefined)
      }, READ_DEBOUNCE_MS),
    )
  },

  markDeliveredUpTo: (groupId, messageId) => {
    const hw = deliveredHighwater.get(groupId) ?? 0
    if (messageId <= hw) return
    deliveredHighwater.set(groupId, messageId)
    deliveredPending.set(groupId, Math.max(deliveredPending.get(groupId) ?? 0, messageId))
    if (deliveredTimers.has(groupId)) return
    deliveredTimers.set(
      groupId,
      setTimeout(() => {
        const id = deliveredPending.get(groupId) ?? 0
        deliveredTimers.delete(groupId)
        deliveredPending.delete(groupId)
        if (id > 0) void markDelivered(groupId, id).catch(() => undefined)
      }, DELIVERED_DEBOUNCE_MS),
    )
  },

  markRead: (groupId) => {
    set((state) => {
      if (!state.unread[groupId] && !state.mentionUnread[groupId]) return state
      const unread = { ...state.unread, [groupId]: 0 }
      const mentionUnread = { ...state.mentionUnread, [groupId]: 0 }
      saveUnread(unread)
      saveMentions(mentionUnread)
      return { unread, mentionUnread }
    })
  },

  reset: () => {
    saveUnread({})
    saveMentions({})
    clearMuteExpiry()
    set({
      open: false,
      inRoom: false,
      groups: [],
      groupsLoaded: false,
      dms: [],
      dmsLoaded: false,
      dmsCursor: null,
      loadingDms: false,
      discover: [],
      discoverLoaded: false,
      discoverCursor: null,
      loadingDiscover: false,
      joiningId: null,
      previewId: null,
      activeGroupId: null,
      messagesByGroup: {},
      hasMoreByGroup: {},
      unread: {},
      mentionUnread: {},
      typing: {},
      reads: {},
      deliveries: {},
      reply: null,
      lastMarkedRead: {},
      muted: false,
      mutedUntil: null,
    })
  },
}))

export const useTotalUnread = (): number =>
  useChatStore((s) => {
    let sum = 0
    for (const n of Object.values(s.unread)) sum += n
    return sum
  })

export const useTotalMentions = (): number =>
  useChatStore((s) => {
    let sum = 0
    for (const n of Object.values(s.mentionUnread)) sum += n
    return sum
  })
