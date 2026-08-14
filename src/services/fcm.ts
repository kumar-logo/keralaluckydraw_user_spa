import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
} from 'firebase/messaging'
import type { FirebaseWebConfig } from './configApi'
import { registerFcmToken } from './hallApi'
import { useNotificationStore } from '../stores/notificationStore'

const buildSwUrl = (config: FirebaseWebConfig): string => {
  const params = new URLSearchParams({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  })
  return `${import.meta.env.BASE_URL}firebase-messaging-sw.js?${params.toString()}`
}

export type PushSetupResult =
  | 'ok'
  | 'unsupported'
  | 'no-config'
  | 'denied'
  | 'dismissed'
  | 'no-token'
  | 'error'

const NOTIFICATION_ICON = '/images/logos/icon-192.png'
const NOTIFICATION_BADGE = '/favicon-32.png'

let app: FirebaseApp | null = null
let messaging: Messaging | null = null
let foregroundBound = false
let lastRegisteredToken: string | null = null
let swRegistration: ServiceWorkerRegistration | null = null

export const getPushPermission = (): NotificationPermission | 'unsupported' => {
  if (
    typeof window === 'undefined' ||
    typeof Notification === 'undefined' ||
    !('serviceWorker' in navigator)
  ) {
    return 'unsupported'
  }
  return Notification.permission
}

const showOsNotification = (
  title: string,
  body: string,
  imageUrl: string | null,
): void => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return
  }
  const options: NotificationOptions & { image?: string } = {
    body,
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_BADGE,
    ...(imageUrl ? { image: imageUrl } : {}),
    data: { url: '/notifications' },
  }
  if (swRegistration) {
    void swRegistration.showNotification(title, options)
    return
  }
  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.ready
      .then((reg) => reg.showNotification(title, options))
      .catch(() => {
        try {
          new Notification(title, options)
        } catch {}
      })
    return
  }
  try {
    new Notification(title, options)
  } catch {}
}

const isConfigComplete = (config: FirebaseWebConfig): boolean =>
  config.apiKey.length > 0 &&
  config.projectId.length > 0 &&
  config.appId.length > 0 &&
  config.messagingSenderId.length > 0 &&
  config.vapidKey.length > 0

const ensureApp = (config: FirebaseWebConfig): FirebaseApp => {
  if (app) return app
  const existing = getApps()
  app = existing.length > 0 ? existing[0] : initializeApp(config)
  return app
}

const NO_ACTIVE_SW = 'no active Service Worker'

const waitForActiveWorker = async (
  registration: ServiceWorkerRegistration,
): Promise<void> => {
  if (registration.active) return
  const worker = registration.installing ?? registration.waiting
  if (!worker) {
    await navigator.serviceWorker.ready
    return
  }
  await new Promise<void>((resolve) => {
    const onChange = () => {
      if (worker.state === 'activated') {
        worker.removeEventListener('statechange', onChange)
        resolve()
      }
    }
    worker.addEventListener('statechange', onChange)
    onChange()
  })
}

const getFcmToken = async (
  instance: Messaging,
  registration: ServiceWorkerRegistration,
  vapidKey: string,
): Promise<string> => {
  const opts = { serviceWorkerRegistration: registration, vapidKey }
  try {
    return await getToken(instance, opts)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!message.includes(NO_ACTIVE_SW)) throw err
    await waitForActiveWorker(registration)
    return getToken(instance, opts)
  }
}

const bindForeground = (instance: Messaging): void => {
  if (foregroundBound) return
  foregroundBound = true
  onMessage(instance, (payload) => {
    const title = payload.notification?.title ?? payload.data?.title ?? ''
    const body = payload.notification?.body ?? payload.data?.body ?? ''
    const rawId = payload.data?.messageId
    const id = rawId ? Number(rawId) : Date.now()
    const imageUrl =
      payload.notification?.image ?? payload.data?.image ?? payload.data?.imageUrl ?? null
    useNotificationStore.getState().pushRealtimeNotification({
      id,
      title,
      content: body,
      type: 'system',
      createdAt: Date.now(),
      imageUrl,
    })
    showOsNotification(title, body, imageUrl)
  })
}

export const registerDevicePush = async (
  config: FirebaseWebConfig | null,
  authToken?: string | null,
): Promise<PushSetupResult> => {
  if (!config || !isConfigComplete(config)) {
    console.info('[push] skipped: firebase config incomplete')
    return 'no-config'
  }
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return 'unsupported'
  }
  if (typeof Notification === 'undefined') return 'unsupported'

  try {
    const supported = await isSupported()
    if (!supported) {
      console.info('[push] skipped: browser does not support web push (FCM)')
      return 'unsupported'
    }

    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }
    if (permission === 'denied') {
      console.info('[push] permission denied')
      return 'denied'
    }
    if (permission !== 'granted') {
      console.info('[push] permission not granted (dismissed)')
      return 'dismissed'
    }

    if (!authToken) return 'ok'

    const registration = await navigator.serviceWorker.register(buildSwUrl(config), {
      scope: import.meta.env.BASE_URL,
    })
    swRegistration = registration
    await waitForActiveWorker(registration)

    const instance = getMessaging(ensureApp(config))
    messaging = instance
    bindForeground(instance)

    const token = await getFcmToken(instance, registration, config.vapidKey)
    if (!token) {
      console.warn('[push] getToken returned empty — check VAPID key / project')
      return 'no-token'
    }
    if (token !== lastRegisteredToken) {
      await registerFcmToken(token)
      lastRegisteredToken = token
    }
    return 'ok'
  } catch (err) {
    console.warn('FCM device push registration failed:', err)
    return 'error'
  }
}
