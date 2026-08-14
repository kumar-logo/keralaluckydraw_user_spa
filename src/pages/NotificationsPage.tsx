import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, ScrollShadow } from '@nextui-org/react'
import { motion, AnimatePresence, useAnimationControls, type PanInfo } from 'framer-motion'
import clsx from 'clsx'
import { useNotificationStore, type NotificationItem } from '../stores/notificationStore'
import { useAppConfigStore } from '../stores/configStore'
import { useAuthStore } from '../stores/authStore'
import { registerDevicePush, getPushPermission } from '../services/fcm'
import { formatDate } from '../utils/date'
import { withLoading } from '../utils/helpers'
import { TopBar } from '../components/shared/TopBar'
import { Spin } from '../components/shared/Spin'
import { NotificationImageSlider } from '../components/shared/NotificationImageSlider'

const REVEAL_X = -76

const TrashIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
)

const NotificationRow = ({
  item,
  onRead,
  onDelete,
}: {
  item: NotificationItem
  onRead: (id: number) => void
  onDelete: (id: number) => void
}) => {
  const { t } = useTranslation()
  const controls = useAnimationControls()
  const [revealed, setRevealed] = useState(false)
  const images = item.images && item.images.length > 0 ? item.images : item.imageUrl ? [item.imageUrl] : []

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    const spring = { type: 'spring' as const, stiffness: 500, damping: 40 }
    if (info.velocity.x < -900) {
      onDelete(item.id)
    } else if (info.offset.x < -35) {
      controls.start({ x: REVEAL_X, transition: spring })
      setRevealed(true)
    } else {
      controls.start({ x: 0, transition: spring })
      setRevealed(false)
    }
  }

  const handleClick = () => {
    if (revealed) {
      controls.start({ x: 0 })
      setRevealed(false)
      return
    }
    onRead(item.id)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-lg"
    >
      <div className="absolute inset-y-0 right-0 flex w-[76px] items-center justify-center">
        <motion.button
          type="button"
          aria-label={t('common.button.delete', { defaultValue: 'Delete' })}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(item.id)
          }}
          animate={{ scale: revealed ? 1 : 0.4, opacity: revealed ? 1 : 0.5 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          style={{ backgroundColor: '#ff3b30', boxShadow: '0 4px 12px rgba(255,59,48,0.45)' }}
          className="flex size-10 items-center justify-center rounded-full text-white active:scale-90"
        >
          <TrashIcon className="size-5" />
        </motion.button>
      </div>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: REVEAL_X, right: 0 }}
        dragElastic={{ left: 0.35, right: 0 }}
        animate={controls}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        className={clsx(
          'relative cursor-pointer rounded-lg p-3',
          item.isRead ? 'bg-white dark:bg-gray' : 'bg-selected dark:bg-charcoal'
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span className={clsx('text-sm text-main', item.isRead ? 'font-medium' : 'font-bold')}>
            {item.title}
          </span>
          {!item.isRead && <span className="size-2 mt-1.5 shrink-0 rounded-full bg-danger" />}
        </div>
        {item.content && (
          <p className="text-xs text-sec mt-1 whitespace-pre-wrap break-words">{item.content}</p>
        )}
        {images.length > 0 && (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <NotificationImageSlider images={images} />
          </div>
        )}
        <p className="text-10 text-acc mt-2">{formatDate(item.createdAt)}</p>
      </motion.div>
    </motion.div>
  )
}

const BellIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22zm6.5-6V11a6.5 6.5 0 00-5-6.32V4a1.5 1.5 0 00-3 0v.68A6.5 6.5 0 005.5 11v5l-2 2v1h17v-1l-2-2z" />
  </svg>
)

const PushPermissionBanner = () => {
  const { t } = useTranslation()
  const token = useAuthStore((s) => s.token)
  const firebase = useAppConfigStore((s) => s.firebase)
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>(() =>
    getPushPermission(),
  )
  const [busy, setBusy] = useState(false)

  if (!token || perm === 'granted' || perm === 'unsupported') return null

  const enable = async () => {
    setBusy(true)
    try {
      await registerDevicePush(firebase, token)
    } finally {
      setPerm(getPushPermission())
      setBusy(false)
    }
  }

  const blocked = perm === 'denied'
  return (
    <div
      className="mx-2 mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5"
      style={{
        background: 'rgba(59,130,246,0.08)',
        border: '1px solid rgba(59,130,246,0.28)',
      }}
    >
      <BellIcon className="size-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-main">
          {blocked
            ? t('notification.pushBlockedTitle', {
                defaultValue: 'Notifications are blocked',
              })
            : t('notification.pushEnableTitle', {
                defaultValue: 'Turn on notifications',
              })}
        </p>
        <p className="text-10 text-acc">
          {blocked
            ? t('notification.pushBlockedDesc', {
                defaultValue: 'Allow notifications for this site in your browser settings.',
              })
            : t('notification.pushEnableDesc', {
                defaultValue: 'Get instant alerts for results, offers and account updates.',
              })}
        </p>
      </div>
      {!blocked && (
        <Button
          size="sm"
          color="primary"
          className="shrink-0 font-bold"
          isLoading={busy}
          onPress={enable}
        >
          {t('notification.pushEnableBtn', { defaultValue: 'Enable' })}
        </Button>
      )}
    </div>
  )
}

export const NotificationsPage = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const notifications = useNotificationStore((s) => s.notifications)
  const notifUnread = useNotificationStore((s) => s.notifUnread)
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications)
  const fetchNotifUnread = useNotificationStore((s) => s.fetchNotifUnread)
  const markNotifRead = useNotificationStore((s) => s.markNotifRead)
  const markAllNotifRead = useNotificationStore((s) => s.markAllNotifRead)
  const deleteNotif = useNotificationStore((s) => s.deleteNotif)
  const clearAllNotifs = useNotificationStore((s) => s.clearAllNotifs)

  useEffect(() => {
    withLoading(setLoading, fetchNotifications(1))
    fetchNotifUnread()
  }, [fetchNotifications, fetchNotifUnread])

  return (
    <div className="size-full flex flex-col">
      <TopBar
        title={t('common.label.notifications')}
        rightNode={
          notifications.length > 0 ? (
            <div className="flex items-center gap-3">
              {notifUnread > 0 && (
                <Button
                  size="sm"
                  className="h-auto min-w-0 bg-transparent px-0 text-xs font-bold text-primary"
                  onPress={() => markAllNotifRead()}
                >
                  {t('notification.markAllRead', { defaultValue: 'Mark all read' })}
                </Button>
              )}
              <Button
                size="sm"
                className="h-auto min-w-0 bg-transparent px-0 text-xs font-bold text-danger"
                onPress={() => clearAllNotifs()}
              >
                {t('notification.clearAll', { defaultValue: 'Clear all' })}
              </Button>
            </div>
          ) : undefined
        }
      />

      <PushPermissionBanner />

      <Spin className="flex-1 flex flex-col min-h-0" loading={loading}>
        <ScrollShadow className="flex-1 p-2 min-h-0 overflow-y-auto">
          {notifications.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-acc">
              <svg className="size-16 mb-4 opacity-30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22zm6.5-6V11a6.5 6.5 0 00-5-6.32V4a1.5 1.5 0 00-3 0v.68A6.5 6.5 0 005.5 11v5l-2 2v1h17v-1l-2-2z" />
              </svg>
              <p className="text-sm">{t('common.tip.info.noSthYet', { sth: t('common.label.notifications') })}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {notifications.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    onRead={markNotifRead}
                    onDelete={deleteNotif}
                  />
                ))}
              </AnimatePresence>
              {notifications.length > 0 && (
                <p className="text-center text-10 text-acc py-3">{t('common.label.noMoreData')}</p>
              )}
            </div>
          )}
        </ScrollShadow>
      </Spin>
    </div>
  )
}

export default NotificationsPage
