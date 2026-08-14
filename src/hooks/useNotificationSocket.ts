import { useEffect, createElement } from 'react'
import { type Socket } from 'socket.io-client'
import { getApiBaseUrl } from '../config/env'
import { useAuthStore } from '../stores/authStore'
import { useNotificationStore, type RealtimeNotification } from '../stores/notificationStore'
import { toast } from '../utils/toast'
import { NotificationImageSlider } from '../components/shared/NotificationImageSlider'

let socket: Socket | null = null
let connecting = false
let listenerCount = 0

const disconnect = (): void => {
  socket?.disconnect()
  socket = null
  connecting = false
}

const handleNotification = (payload: RealtimeNotification): void => {
  if (!payload || payload.id == null) return
  useNotificationStore.getState().pushRealtimeNotification(payload)
  const images =
    payload.images && payload.images.length > 0
      ? payload.images
      : payload.imageUrl
        ? [payload.imageUrl]
        : []
  if (images.length > 0) {
    toast.show({
      icon: 'success',
      delay: 5000,
      message: createElement(
        'div',
        { className: 'flex flex-col gap-2 w-56 max-w-[70vw]' },
        payload.title
          ? createElement('span', { className: 'text-sm font-bold text-white text-center' }, payload.title)
          : null,
        createElement(NotificationImageSlider, { images, compact: true, autoPlay: true }),
      ),
    })
  } else if (payload.title) {
    toast.success(payload.title)
  }
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
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
    })
    socket.on('notification', handleNotification)
  } finally {
    connecting = false
  }
}

export const useNotificationSocket = (): void => {
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    if (!token) {
      disconnect()
      return
    }

    listenerCount += 1
    connect(token)

    return () => {
      listenerCount -= 1
      if (listenerCount <= 0) {
        listenerCount = 0
        disconnect()
      }
    }
  }, [token])
}
