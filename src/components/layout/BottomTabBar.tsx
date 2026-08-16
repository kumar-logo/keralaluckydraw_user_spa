import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { useNotificationStore } from '../../stores/notificationStore'
import { useChatStore, useTotalUnread } from '../../stores/chatStore'
import { HomeIcon, ResultIcon, TicketsIcon, AccountIcon, SupportGlyph } from './BottomTabIcons'
import './bottom-nav.css'

export const BottomTabBar = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('home')
  const openChat = useChatStore((s) => s.openPanel)
  const totalUnread = useTotalUnread()
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
      case 'index/my-bets': setActiveTab('my-bets'); break
      case 'index/me': setActiveTab('me'); break
    }
  }, [pathname])

  return (
    <div className="an-root fixed bottom-0 w-full max-w-(--max-screen-width) z-50">
      <nav className="kd-nav">
        <div className={clsx('kd-item', activeTab === 'home' && 'is-active')} onClick={() => navigate('/index/home')}>
          <HomeIcon />
          <span className="kd-label">{t('common.label.home')}</span>
        </div>

        <div className={clsx('kd-item', activeTab === 'result' && 'is-active')} onClick={() => navigate('/index/result')}>
          <ResultIcon />
          <span className="kd-label">{t('common.label.result')}</span>
        </div>

        <div className="kd-item kd-support" onClick={openChat}>
          <div className="kd-circle-wrap">
            {totalUnread ? (
              <span className="kd-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
            ) : null}
            <div className="kd-circle">
              <SupportGlyph />
            </div>
          </div>
          <span className="kd-label">{t('common.label.support')}</span>
        </div>

        <div className={clsx('kd-item', activeTab === 'my-bets' && 'is-active')} onClick={() => navigate('/index/my-bets')}>
          <TicketsIcon />
          <span className="kd-label">{t('common.label.tickets')}</span>
        </div>

        <div className={clsx('kd-item', activeTab === 'me' && 'is-active')} onClick={() => navigate('/index/me')}>
          <div className="kd-ico-wrap">
            {unreaderCSmsg ? <span className="kd-dot" /> : null}
            <AccountIcon />
          </div>
          <span className="kd-label">{t('common.label.account')}</span>
        </div>
      </nav>
    </div>
  )
}
