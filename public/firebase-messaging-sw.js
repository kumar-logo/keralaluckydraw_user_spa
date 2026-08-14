/* Firebase Cloud Messaging service worker.
 * Handles background push messages for the user app. The Firebase web-config is
 * passed synchronously via the registration URL query string (see
 * services/fcm.ts) so firebase.messaging() — which registers the push /
 * pushsubscriptionchange / notificationclick handlers — runs during the initial
 * (synchronous) evaluation of this worker. Registering those handlers after an
 * await (e.g. an async config fetch) makes the browser drop push events, so the
 * config MUST arrive without any async step. If the config is absent the worker
 * still installs but never initializes messaging (no-op).
 */
/* global importScripts, firebase, self, clients */
importScripts(
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
)
importScripts(
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js',
)

const params = new URLSearchParams(self.location.search)
const config = {
  apiKey: params.get('apiKey') || '',
  authDomain: params.get('authDomain') || '',
  projectId: params.get('projectId') || '',
  storageBucket: params.get('storageBucket') || '',
  messagingSenderId: params.get('messagingSenderId') || '',
  appId: params.get('appId') || '',
}

if (config.apiKey && config.projectId && config.appId && config.messagingSenderId) {
  firebase.initializeApp(config)
  const messaging = firebase.messaging()
  messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification || {}
    const data = payload.data || {}
    const title = notification.title || data.title || 'Kerala Lucky Draw'
    const image = notification.image || data.image || data.imageUrl
    self.registration.showNotification(title, {
      body: notification.body || data.body || '',
      icon: '/images/logos/icon-192.png',
      badge: '/favicon-32.png',
      tag: data.messageId || 'keralaluckydraw-message',
      renotify: true,
      vibrate: [200, 100, 200],
      ...(image ? { image } : {}),
      data: Object.assign({}, data, { url: data.url || '/notifications' }),
    })
  })
}

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target =
    (event.notification.data && event.notification.data.url) || '/notifications'
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            if ('navigate' in client) {
              try {
                client.navigate(target)
              } catch (e) {
                /* cross-origin navigate not allowed; just focus */
              }
            }
            return client.focus()
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(target)
      }),
  )
})
