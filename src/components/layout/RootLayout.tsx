import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { useWsStore } from '../../stores/wsStore'
import { useNotificationStore } from '../../stores/notificationStore'
import { useNotificationSocket } from '../../hooks/useNotificationSocket'
import { useChatSocket } from '../../hooks/useChatSocket'
import { useFcmRegistration } from '../../hooks/useFcmRegistration'
import { ChatWidget } from '../chat/ChatWidget'
import { getUserInfo } from '../../services/userApi'
import { checkAuth } from '../../utils/helpers'
import { PrizeEventHandler } from '../shared/PrizePopup'
import { AnnouncementPopup } from '../shared/AnnouncementPopup'
import { UpdateDialog } from '../shared/UpdateDialog'
import { SalesSmartlyChat } from '../shared/SalesSmartlyChat'
import { openCS } from '../shared/salesSmartly'

const WsConnector = () => {
  const connect = useWsStore((s) => s.connect)
  const connected = useWsStore((s) => s.connected)
  const send = useWsStore((s) => s.send)
  const userInfo = useAuthStore((s) => s.userInfo)
  const lastUserId = useRef<number | null>(null)

  useEffect(() => {
    if (connected) {
      if (userInfo?.userID) {
        if (lastUserId.current === userInfo.userID) return
        lastUserId.current = userInfo.userID
        send(900, { userId: userInfo.userID })
      } else {
        if (!lastUserId.current) return
        send(901)
      }
    }
  }, [userInfo, connected])

  useEffect(() => {
    if (!connected) connect()
    const handler = () => {
      if (document.visibilityState === 'visible' && !useWsStore.getState().connected) connect()
    }
    window.addEventListener('visibilitychange', handler)
    return () => window.removeEventListener('visibilitychange', handler)
  }, [])

  return null
}

const NotificationConnector = () => {
  const token = useAuthStore((s) => s.token)
  const fetchNotifUnread = useNotificationStore((s) => s.fetchNotifUnread)

  useNotificationSocket()
  useChatSocket()
  useFcmRegistration()

  useEffect(() => {
    if (token) fetchNotifUnread()
  }, [token])

  return null
}

const BanGuard = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const token = useAuthStore((s) => s.token)
  const userInfo = useAuthStore((s) => s.userInfo)
  const setUserInfo = useAuthStore((s) => s.setUserInfo)

  useEffect(() => {
    if (!token) return
    getUserInfo()
      .then((info) => { if (info) setUserInfo(info) })
      .catch(() => undefined)
  }, [token, setUserInfo])

  useEffect(() => {
    if (token && userInfo?.status === 0 && pathname !== '/banned') {
      navigate('/banned', { replace: true })
    }
  }, [token, userInfo, pathname, navigate])

  return null
}

const AUTH_ROUTES = ['/login', '/register', '/spread-register']

export const RootLayout = () => {
  const { pathname, search } = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { i18n: { language } } = useTranslation()
  const setRtl = useUIStore((s) => s.setRtl)
  const prevPathRef = useRef(pathname)
  const prevParamsRef = useRef(searchParams)

  useEffect(() => {
    const channel = localStorage.getItem('channel')
    const nexuses = (window as Window & { nexuses?: unknown }).nexuses
    const standalone = (navigator as Navigator & { standalone?: boolean }).standalone
    const se = { isInApp: !!nexuses, isStandalone: window.matchMedia('(display-mode: standalone)').matches || !!standalone }
    const show = !(se.isInApp || se.isStandalone || (channel != null && channel.startsWith('TG')))
    localStorage.setItem('showDownload', show ? 'true' : '')
    localStorage.setItem('isInFBWV', /FBAV|FBAN|Instagram/.test(window.navigator.userAgent) ? 'true' : '')
  }, [])

  useEffect(() => {
    if (pathname === '/') navigate('/index' + search, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (pathname !== prevPathRef.current || searchParams.toString() !== prevParamsRef.current.toString()) {
      if (!AUTH_ROUTES.some((route) => route.startsWith(prevPathRef.current))) {
        sessionStorage.setItem('lastPagePath', prevPathRef.current)
        sessionStorage.setItem('lastPageParams', prevParamsRef.current.toString())
      }
      prevPathRef.current = pathname
      prevParamsRef.current = searchParams
    }
  }, [pathname, searchParams])

  useEffect(() => {
    if (language === 'fa') {
      document.body.setAttribute('dir', 'rtl')
      setRtl(true)
    } else {
      document.body.setAttribute('dir', '')
      setRtl(false)
    }
  }, [language])

  useEffect(() => {

    const onLoginModal = () => navigate('/login')

    const onRecharge = () => {
      if (!checkAuth(false, false)) return
      navigate('/recharge')
    }
    const onCustomerService = () => {
      openCS()
    }
    const onDownload = () => navigate('/store/apps/details')

    const onGotoUrl = (e: Event) => {
      const { url, type } = (e as CustomEvent).detail || {}
      if (!url) return
      if (url === '/login') {
        useAuthStore.getState().removeToken()
      }
      if (type === 'replace') navigate(url, { replace: true })
      else navigate(url)
    }

    window.addEventListener('openLoginModal', onLoginModal)
    window.addEventListener('gotourl', onGotoUrl)
    window.addEventListener('openRechargeDraw', onRecharge)
    window.addEventListener('openCustomerService', onCustomerService)
    window.addEventListener('triggerDownload', onDownload)
    return () => {
      window.removeEventListener('openLoginModal', onLoginModal)
      window.removeEventListener('gotourl', onGotoUrl)
      window.removeEventListener('openRechargeDraw', onRecharge)
      window.removeEventListener('openCustomerService', onCustomerService)
      window.removeEventListener('triggerDownload', onDownload)
    }
  }, [navigate])

  return (
    <>
      <WsConnector />
      <NotificationConnector />
      <BanGuard />
      <SalesSmartlyChat />
      <PrizeEventHandler />
      <AnnouncementPopup />
      <UpdateDialog />
      <Outlet />
      <ChatWidget />
    </>
  )
}
