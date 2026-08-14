import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { useAuthStore } from '../../stores/authStore'
import { useRechargeStore } from '../../stores/rechargeStore'
import { useNotificationStore } from '../../stores/notificationStore'
import { checkAuth } from '../../utils/helpers'
import { NavBarSpacer } from '../shared/NavBarSpacer'
import { HomeIcon, ResultIcon, MyBetsIcon, ProfileIcon } from './BottomTabIcons'
import './bottom-nav.css'

const NotificationDot = ({ className }: { className?: string }) => (
  <div className={clsx('size-2.5 border border-white bg-danger rounded-full', className)} />
)

const PingDot = ({ className, ping, wapperClassName }: { className?: string; ping?: boolean; wapperClassName?: string }) =>
  ping ? (
    <div className={clsx('relative', wapperClassName)}>
      <NotificationDot className={clsx('animate-ping absolute left-0 top-0', className)} />
      <NotificationDot className={className} />
    </div>
  ) : (
    <NotificationDot className={className} />
  )

const Badge = ({ children, className, ping, outline }: { children?: React.ReactNode; className?: string; ping?: boolean; outline?: boolean }) => {
  const colorClass = outline ? 'text-tip border border-tip' : 'text-white bg-tip'
  const inner = (
    <div className={clsx('px-1.5 py-0.5 text-8 rounded-full flex items-center justify-center', colorClass, className)}>
      {children}
    </div>
  )
  if (ping) {
    return (
      <div className="relative">
        <div className={clsx('px-1.5 py-0.5 text-8 rounded-full flex items-center justify-center animate-ping absolute left-0 top-0', colorClass, className)}>
          {children}
        </div>
        {inner}
      </div>
    )
  }
  return inner
}

const TabButton = ({ active, icon, path, title, children }: {
  active: boolean
  icon: React.ReactNode
  path: string
  title: string
  children?: React.ReactNode
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const openRecharge = useRechargeStore((s) => s.openRecharge)

  const handleClick = () => {
    const target = '/index/' + path
    switch (path) {
      case 'recharge':
        if (checkAuth()) openRecharge()
        break
      case 'rebate':
      case 'withdraw':
        if (checkAuth()) navigate(target)
        break
      default:
        navigate(target)
    }
  }

  return (
    <div className={clsx('flex-1 relative an-tab', active && 'is-active')} onClick={handleClick}>
      <div className="an-tab-inner">
        <div className="an-tab-ico">{icon}</div>
        <span className="an-tab-label">{t(title)}</span>
      </div>
      {children}
    </div>
  )
}

export const BottomTabBar = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [activeTab, setActiveTab] = useState('home')
  const userInfo = useAuthStore((s) => s.userInfo)
  const freeSpinCount = (userInfo as { freeSpinCount?: number } | null | undefined)?.freeSpinCount ?? 0
  const unreaderCSmsg = useNotificationStore((s) => s.unreaderCSmsg)
  const initNotifications = useNotificationStore((s) => s.init)

  useEffect(() => {
    if (localStorage.getItem('shortcuts_daily_bonus')) {
      navigate('/index/earn-money')
      localStorage.removeItem('shortcuts_daily_bonus')
    } else if (localStorage.getItem('shortcuts_get_100rs')) {
      navigate('/index/lucky-spin')
    }
  }, [])

  useEffect(() => {
    initNotifications()
    const interval = setInterval(() => { initNotifications() }, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const segments = pathname.split('?')[0].split('/').slice(-2).join('/')
    switch (segments) {
      case 'index/home': setActiveTab('home'); break
      case 'index/result': setActiveTab('result'); break
      case 'index/lucky-spin': setActiveTab('lucky-spin'); break
      case 'index/my-bets': setActiveTab('my-bets'); break
      case 'index/me': setActiveTab('me'); break
    }
  }, [pathname])

  return (
    <div className="an-root fixed bottom-0 w-full max-w-(--max-screen-width) z-50">
      <div className="an-nav ka-visible z-40 relative">
        <div className="an-bar">

        <div className="an-row">
          <TabButton active={activeTab === 'home'} title="common.label.home" path="home"
            icon={<HomeIcon active={activeTab === 'home'} />} />

          <TabButton active={activeTab === 'result'} title="common.label.result" path="result"
            icon={<ResultIcon active={activeTab === 'result'} />} />

          <div className="an-spin" onClick={() => navigate('/index/lucky-spin')}>
            {freeSpinCount ? (
              <div className="absolute w-full top-0 left-0 z-20 flex items-center justify-center">
                <Badge className="text-10">
                  Free × {freeSpinCount > 99 ? '99+' : freeSpinCount}
                </Badge>
              </div>
            ) : null}
            <lottie-player
              src="/json/lucky-spin-tab.json"
              className="size-15 relative -top-2"
              autoplay
              loop
            />

            <div
              className="absolute bottom-3 left-1/2"
              style={{
                backgroundImage: 'url(/images/lucky-spin/lucky-spin-sprite.webp)',
                backgroundSize: '47.25rem 28.875rem',
                backgroundPosition: 'right -1.25rem top -6.875rem',
                width: '4.625rem',
                height: '1.25rem',
                marginLeft: '-2.3125rem',
              }}
            />
          </div>

          <TabButton active={activeTab === 'my-bets'} title="common.label.games.myBets" path="my-bets"
            icon={<MyBetsIcon active={activeTab === 'my-bets'} />} />

          <TabButton active={activeTab === 'me'} title="me.me" path="me"
            icon={<ProfileIcon active={activeTab === 'me'} />}>
            {unreaderCSmsg ? (
              <PingDot wapperClassName="!absolute left-1/2 -top-0.5 ml-0.5 z-20" />
            ) : null}
          </TabButton>
        </div>
        </div>
      </div>
      <NavBarSpacer className="an-safe" />
    </div>
  )
}
