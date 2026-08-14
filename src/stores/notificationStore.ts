import { create } from 'zustand'
import apiClient from '../services/api'
import {
  getNotificationList,
  getNotificationUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from '../services/hallApi'
import { checkAuth } from '../utils/helpers'

const fetchUnreadCount = () => apiClient.get('/hall/api/usr/v1/msg/unread/count')

export interface NotificationItem {
  id: number
  title: string
  content: string
  type: string
  isRead: boolean
  createdAt: string | number
  imageUrl?: string | null
  images?: string[]
}

export interface RealtimeNotification {
  id: number
  title: string
  content: string
  type: string
  createdAt: string | number
  imageUrl?: string | null
  images?: string[]
}

interface NotificationListResponse {
  list?: NotificationItem[]
}

interface NotificationUnreadResponse {
  count?: number
}

interface UnreadCountPayload {
  chipAwardCount?: number
  k3cAwardCount?: number
  spinAwardCount?: number
  unreaderCSmsg?: boolean
}

interface NotificationStore {
  chipAwardCount: number
  k3cAwardCount: number
  spinAwardCount: number
  unClaimAward: boolean
  unreaderCSmsg: boolean
  notifications: NotificationItem[]
  notifUnread: number
  updateCSmsg: (v: boolean) => void
  fetchNotifications: (pageNo?: number, pageSize?: number) => Promise<void>
  fetchNotifUnread: () => Promise<void>
  markNotifRead: (id: number) => void
  markAllNotifRead: () => void
  deleteNotif: (id: number) => void
  clearAllNotifs: () => void
  pushRealtimeNotification: (payload: RealtimeNotification) => void
  init: () => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  chipAwardCount: 0,
  k3cAwardCount: 0,
  spinAwardCount: 0,
  unClaimAward: false,
  unreaderCSmsg: false,
  notifications: [],
  notifUnread: 0,
  updateCSmsg: (hasUnread) => set({ unreaderCSmsg: hasUnread }),
  fetchNotifications: async (pageNo = 1, pageSize = 20) => {
    if (!checkAuth(false, false)) return
    const data = (await getNotificationList(pageNo, pageSize)) as NotificationListResponse
    const list: NotificationItem[] = Array.isArray(data?.list) ? data.list : []
    set((state) => ({
      notifications: pageNo <= 1 ? list : [...state.notifications, ...list],
    }))
  },
  fetchNotifUnread: async () => {
    if (!checkAuth(false, false)) return
    const data = (await getNotificationUnreadCount()) as NotificationUnreadResponse
    set({ notifUnread: Number(data?.count) || 0 })
  },
  markNotifRead: (id) => {
    const target = get().notifications.find((n) => n.id === id)
    if (target && target.isRead) return
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      notifUnread: Math.max(0, state.notifUnread - 1),
    }))
    markNotificationRead(id).catch(() => {})
  },
  deleteNotif: (id) => {
    const target = get().notifications.find((n) => n.id === id)
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      notifUnread:
        target && !target.isRead
          ? Math.max(0, state.notifUnread - 1)
          : state.notifUnread,
    }))
    deleteNotification(id).catch(() => {})
  },
  clearAllNotifs: () => {
    set({ notifications: [], notifUnread: 0 })
    clearAllNotifications().catch(() => {})
  },
  markAllNotifRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      notifUnread: 0,
    }))
    markAllNotificationsRead().catch(() => {})
  },
  pushRealtimeNotification: (payload) => {
    set((state) => {
      if (state.notifications.some((n) => n.id === payload.id)) return state
      return {
        notifications: [{ ...payload, isRead: false }, ...state.notifications],
        notifUnread: state.notifUnread + 1,
      }
    })
  },
  init: () => {
    if (checkAuth(false, false)) {
      fetchUnreadCount().then((response) => {
        const data = response as UnreadCountPayload
        if (data) {
          set({
            ...data,
            unClaimAward: !!(data.chipAwardCount || data.k3cAwardCount || data.spinAwardCount),
          })
        }
      })
      get().fetchNotifUnread()
    }
  },
}))
