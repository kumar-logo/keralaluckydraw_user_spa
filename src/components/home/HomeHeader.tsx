import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Drawer, DrawerContent, Switch, useDisclosure } from '@nextui-org/react'
import clsx from 'clsx'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'
import { useGameStore } from '../../stores/gameStore'
import { useRechargeStore } from '../../stores/rechargeStore'
import { useNotificationStore } from '../../stores/notificationStore'
import { useAppConfigStore } from '../../stores/configStore'
import { checkAuth } from '../../utils/helpers'
import { toast } from '../../utils/toast'
import { HomeSpriteIcon } from '../shared/SpriteIcon'
import { GameImage } from '../shared/GameImage'
import { TopBarWrapper } from '../shared/TopBarWrapper'
import { BottomSheetSelect } from '../shared/BottomSheetSelect'
import { NavBarSpacer } from '../shared/NavBarSpacer'
import { GiftCodeDialog } from '../shared/GiftCodeDialog'
import { LANGUAGE_OPTIONS, LANGUAGE_NAME_MAP } from '../../i18n'
import './home-header.css'

const HamburgerIcon = ({ open }: { open: boolean }) => (
  <svg
    id="HomeMenuIcon"
    className="an-h-burger"
    data-open={open}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect className="an-b-top" x="4" y="6" width="16" height="2" rx="1" fill="currentColor" />
    <rect className="an-b-mid" x="4" y="11" width="9" height="2" rx="1" fill="currentColor" />
    <rect className="an-b-bot" x="4" y="16" width="16" height="2" rx="1" fill="currentColor" />
  </svg>
)

const ChevronRight = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 14 14" className={clsx('size-3.5', className)} fill="none">
    <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const BELL_BODY = 'M12 3.4a5.9 5.9 0 0 1 5.9 5.9v3.3l1.3 2.3a.9.9 0 0 1-.8 1.4H5.6a.9.9 0 0 1-.8-1.4l1.3-2.3V9.3A5.9 5.9 0 0 1 12 3.4z'

const BellIcon = ({ className }: { className?: string }) => (
  <svg
    className={clsx('an-h-bell-ico', className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path className="an-h-bell-blob" stroke="none" fill="currentColor" d={BELL_BODY} />
    <path d={BELL_BODY} />
    <path d="M9.7 19.1a2.4 2.4 0 0 0 4.6 0" />
    <path d="M12 1.7v1.7" />
  </svg>
)

const NotificationBell = () => {
  const navigate = useNavigate()
  const notifUnread = useNotificationStore((s) => s.notifUnread)
  return (
    <div className="an-h-bell relative mr-3 rtl:mr-0 rtl:ml-3" onClick={() => navigate('/notifications')}>
      <BellIcon />
      {notifUnread > 0 && (
        <div className="an-h-badge absolute top-0 right-0 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-danger text-white text-8 font-bold leading-none">
          {notifUnread > 99 ? '99+' : notifUnread}
        </div>
      )}
    </div>
  )
}

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={clsx('size-4 text-sec', className)} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const ThemeIcon = ({ className, ...rest }: { className?: string } & React.SVGProps<SVGSVGElement>) => (
  <svg className={clsx('size-5', className)} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <path d="M8.23926 4.50391C8.02118 5.10629 7.90137 5.75595 7.90137 6.43359C7.90137 9.56434 10.4396 12.1024 13.5703 12.1025C14.2479 12.1025 14.8977 11.9827 15.5 11.7646C14.7106 13.9455 12.6222 15.5039 10.1689 15.5039C7.0381 15.5039 4.5 12.9658 4.5 9.83496C4.50014 7.38188 6.0586 5.29333 8.23926 4.50391Z" fill="#A2A5A5" />
    <circle cx="10" cy="10" r="8.22" stroke="#A2A5A5" strokeWidth="1.56" />
    <path d="M12.6188 5.48443C13.3707 5.9205 14.0018 6.53742 14.4549 7.27921" stroke="var(--basic-color-primary)" strokeWidth="1.56" strokeLinecap="round" />
  </svg>
)

const SunIcon = () => (
  <svg className="size-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_sun_home)">
      <path d="M3.0498 3.05078L3.79227 3.79325" stroke="#A2A5A5" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 8H2.05" stroke="#A2A5A5" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.0498 12.9495L3.79227 12.207" stroke="#A2A5A5" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.9505 12.9495L12.208 12.207" stroke="#A2A5A5" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.0002 8H13.9502" stroke="#A2A5A5" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.9505 3.05078L12.208 3.79325" stroke="#A2A5A5" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 1V2.05" stroke="#A2A5A5" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 12C10.2091 12 12 10.2091 12 8C12 5.79087 10.2091 4 8 4C5.79087 4 4 5.79087 4 8C4 10.2091 5.79087 12 8 12Z" fill="#A2A5A5" stroke="#A2A5A5" strokeWidth="1.33333" strokeLinejoin="round" />
      <path d="M8 15.0012V13.9512" stroke="#A2A5A5" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <defs>
      <clipPath id="clip0_sun_home">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
)

const MoonIcon = () => (
  <svg className="size-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.75781 1.00195C5.48018 1.76874 5.3291 2.59637 5.3291 3.45898C5.32922 7.44382 8.56006 10.6738 12.5449 10.6738C13.4071 10.6738 14.2335 10.5216 15 10.2441C13.9952 13.0199 11.3374 15.0039 8.21484 15.0039C4.22992 15.0039 0.999023 11.773 0.999023 7.78809C0.999191 4.66605 2.98261 2.00692 5.75781 1.00195Z" fill="white" />
  </svg>
)

const LanguageIcon = ({ className, ...rest }: { className?: string } & React.SVGProps<SVGSVGElement>) => (
  <svg className={clsx('size-5', className)} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.0949 1.66602L11.7016 2.03935C11.5049 2.87602 11.8966 3.65518 13.0308 4.46768C15.6774 6.36268 16.3024 7.43102 15.5499 9.79268C15.1066 11.1843 15.6441 11.6927 17.4999 11.6927V13.3327C14.6499 13.3327 13.1441 11.9077 13.9766 9.29768C14.4624 7.77435 14.1999 7.32685 12.0658 5.79768C10.4358 4.63102 9.72743 3.22268 10.0949 1.66602Z" fill="var(--basic-color-primary)" />
      <path d="M2.965 8.66364C2.73254 9.88472 2.82201 11.1453 3.22462 12.3213C3.62723 13.4973 4.32909 14.5482 5.26114 15.3706C6.1932 16.193 7.32332 16.7586 8.5403 17.0116C9.75728 17.2647 11.0192 17.1965 12.2018 16.8139C11.7619 15.7973 11.2823 15.5698 10.3882 15.5952C10.2792 15.5976 10.1861 15.6032 9.9825 15.6151C8.44091 15.7082 7.67409 15.5157 6.94943 14.414C6.13886 13.1842 6.39261 12.2949 7.37102 11.1669L7.48716 11.0333C8.2158 10.1981 8.285 9.93716 7.75602 9.1767C7.16421 8.32557 6.83568 8.28023 5.59955 8.6342C4.43818 8.96591 3.69364 9.03909 2.965 8.66364ZM3.45659 7.09023C3.85591 7.39489 4.21068 7.37659 5.16205 7.10455C6.97807 6.58511 7.98909 6.72591 9.06216 8.2683C10.1026 9.76375 9.83852 10.7581 8.68591 12.0793L8.57296 12.209C8.00818 12.8613 7.95409 13.0482 8.27864 13.5398C8.59523 14.0218 8.8625 14.0886 9.88625 14.0274C10.1074 14.0139 10.2116 14.0083 10.3428 14.0043C11.8653 13.9614 12.9122 14.5293 13.6472 16.1616C14.6161 15.5874 15.4359 14.7926 16.0399 13.842C16.6438 12.8913 17.015 11.8116 17.1232 10.6905C17.2314 9.56939 17.0735 8.43859 16.6625 7.38998C16.2514 6.34137 15.5987 5.40455 14.7575 4.65564C13.9163 3.90673 12.9102 3.36687 11.821 3.07994C10.7319 2.793 9.59044 2.76709 8.4894 3.00431C7.38837 3.24153 6.35884 3.73518 5.48448 4.44514C4.61012 5.15511 3.91561 6.06135 3.45739 7.09023H3.45659ZM10 18.75C5.16761 18.75 1.25 14.8324 1.25 10C1.25 5.16761 5.16761 1.25 10 1.25C14.8324 1.25 18.75 5.16761 18.75 10C18.75 14.8324 14.8324 18.75 10 18.75Z" fill="#A2A5A5" />
    </svg>
  </svg>
)

const CustomerServiceIcon = ({ className, ...rest }: { className?: string } & React.SVGProps<SVGSVGElement>) => (
  <svg className={clsx('size-5', className)} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <path d="M17.269 8.81939C17.2203 4.84471 13.9868 1.63672 10.0002 1.63672C6.0136 1.63672 2.78018 4.84471 2.73137 8.81939C2.06412 9.35287 1.63574 10.1719 1.63574 11.0922C1.63574 12.6988 2.93842 14.0018 4.54512 14.0018C5.24627 14.0018 5.88922 13.7532 6.39148 13.3405L5.02078 8.22484C4.86553 8.19957 4.7074 8.18275 4.54514 8.18275C4.43822 8.18275 4.33313 8.18937 4.22906 8.20084C4.57973 5.32291 7.02727 3.09145 10.0003 3.09145C12.9729 3.09145 15.4209 5.32289 15.7714 8.20084C15.6678 8.18945 15.5623 8.18275 15.4554 8.18275C15.2932 8.18275 15.1347 8.19961 14.9793 8.22484L13.609 13.3381C13.9967 13.6564 14.468 13.8764 14.9852 13.9606C14.2989 14.6979 13.4261 15.2596 12.4388 15.5635L12.3184 15.6837C12.0104 15.1175 11.4175 14.7288 10.7277 14.7288C9.72326 14.7288 8.9093 15.5427 8.9093 16.5475C8.9093 17.552 9.72322 18.3659 10.7277 18.3659C11.5521 18.3659 12.2398 17.8138 12.4631 17.062C14.47 16.5701 16.1512 15.249 17.1168 13.4784C17.8706 12.9527 18.3649 12.0807 18.3649 11.0922C18.3648 10.1721 17.9359 9.35285 17.269 8.81939Z" fill="#A2A5A5" />
    <circle cx="10.6663" cy="16.4173" r="2.08333" fill="var(--basic-color-primary)" />
  </svg>
)

const CsPingDot = () => {
  const unreaderCSmsg = useNotificationStore((s) => s.unreaderCSmsg)
  if (!unreaderCSmsg) return null
  return (
    <div className="relative">
      <div className="size-2.5 border border-white bg-danger rounded-full animate-ping absolute left-0 top-0" />
      <div className="size-2.5 border border-white bg-danger rounded-full" />
    </div>
  )
}

const DrawerMenuItem = ({ icon, children, onClick, rightNode, hiddenArrow }: {
  icon?: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
  rightNode?: React.ReactNode
  hiddenArrow?: boolean
}) => (
  <div className="flex h-12 justify-between items-center text-sm text-sec" onClick={onClick}>
    <div className="flex flex-1">
      {icon}
      {children}
    </div>
    {rightNode}
    {!hiddenArrow && <ChevronRight className="ml-3 size-3.5 rtl:ml-0 rtl:mr-3 rtl:rotate-180" />}
  </div>
)

const navigateToLogin = () => {
  if (location.href.indexOf('/login') > -1) return
  window.dispatchEvent(new CustomEvent('gotourl', {
    detail: { url: '/login?origin=url_' + encodeURIComponent(location.href), type: 'push' }
  }))
}

const openCustomerService = () => {
  window.dispatchEvent(new CustomEvent('openCustomerService'))
}

const SEASONAL_CONFIGS = [
  { key: 'christmas', start: '12-15', end: '12-31' },
  { key: 'newyear', start: '01-01', end: '01-10' },
  { key: 'HoliFestival', start: '03-01', end: '03-31' },
]

const getSeasonalTag = (): string | null => {
  const now = new Date()
  const mmdd = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  for (const s of SEASONAL_CONFIGS) {
    if (mmdd >= s.start && mmdd <= s.end) return s.key
  }
  return null
}

export const HomeHeader = () => {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const token = useAuthStore((s) => s.token)
  const { isOpen, onClose, onOpenChange } = useDisclosure()
  const { isDarkMode } = useUIStore()
  const openRecharge = useRechargeStore((s) => s.openRecharge)
  const collectList = useGameStore((s) => s.collectList)
  const recentlyPlayedList = useGameStore((s) => s.recentlyPlayedList)
  const chatEnabled = useAppConfigStore((s) => s.support.chatEnabled)
  const [seasonalTag, setSeasonalTag] = useState<string | null>(null)
  const [showGiftCode, setShowGiftCode] = useState(false)

  const favoriteGames = useMemo(() => {
    if (collectList.length === 0) return []
    const slice = collectList.slice(0, 4)
    return slice.concat(Array(4 - slice.length).fill(null))
  }, [collectList])

  const recentGames = useMemo(() => {
    if (recentlyPlayedList.length === 0) return []
    const slice = recentlyPlayedList.slice(0, 4)
    return slice.concat(Array(4 - slice.length).fill(null))
  }, [recentlyPlayedList])

  const withAuth = (fn: () => void) => {
    if (checkAuth(false, false)) {
      fn()
    } else {
      toast.warning(t('common.tip.info.loginFirst'))
    }
  }

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', isDarkMode ? 'light' : 'dark')
  }

  useEffect(() => {
    setSeasonalTag(getSeasonalTag())
  }, [])

  return (
    <>

      <TopBarWrapper
        className="an-header sticky! top-0"
        boxShadow=""
        hideBack
        title=""
        leftNode={
          <div className="an-h-menu" onClick={() => onOpenChange()}>
            <HamburgerIcon open={isOpen} />
            {seasonalTag === 'christmas' ? (
              <div className="w-28 h-9.5 bg-no-repeat bg-contain bg-[url(/images/home/keralaluckydraw-12-25-dark.webp)] dark:bg-[url(/images/home/keralaluckydraw-12-25-light.webp)]" />
            ) : seasonalTag === 'newyear' ? (
              <div className="w-23 h-8 bg-no-repeat ml-2 bg-contain bg-[url(/images/home/keralaluckydraw-01-01.webp)]" />
            ) : seasonalTag === 'HoliFestival' ? (
              <div className="w-32 h-9.5 bg-no-repeat ml-2 bg-contain bg-[url(/images/home/keralaluckydraw-holi.webp)]" />
            ) : (
              <span className="an-h-word ml-2 text-main font-black">{t('common.label.menu')}</span>
            )}
          </div>
        }
        rightNodeType={token ? 'wallet' : null}
        rightNode={
          !token ? (
            <div className="flex items-center justify-end flex-1">
              <Button
                onPress={() => navigateToLogin()}
                className="an-h-btn an-h-btn-ghost"
              >
                {t('common.label.login')}
              </Button>
              <div className="w-2" />
              <Button
                className="an-h-btn an-h-btn-primary"
                onPress={() => navigate('/register?origin=home_btn')}
              >
                {t('common.label.register')}
              </Button>
            </div>
          ) : (
            <NotificationBell />
          )
        }
      />

      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        size="full"
        placement="left"
        hideCloseButton
        isDismissable={false}
        classNames={{
          wrapper: 'mt-[calc(2.75rem+var(--status-bar-height))] z-60',
          base: 'bg-light-gray dark:bg-gray',
          backdrop: 'bg-transparent pointer-events-none',
        }}
      >
        <DrawerContent className="w-max flex flex-col justify-between min-h-[calc(100dvh-2.75rem-var(--status-bar-height))]! h-[calc(100dvh-2.75rem-var(--status-bar-height))]!">

            <div className="p-3">

              <div className="flex items-center h-19">
                <HomeSpriteIcon pos="firstRechargeBg" className="h-full flex-1" onClick={() => { onClose(); withAuth(() => openRecharge('home-header-drawer')) }} />
                <div className="h-full flex-1 mx-2">
                  <HomeSpriteIcon pos="giftCodeBg" className="size-full" onClick={() => { onClose(); withAuth(() => setShowGiftCode(true)) }} />
                </div>
                <div className="h-full flex-1">
                  <HomeSpriteIcon pos="rankingBg" className="size-full" onClick={() => { onClose(); navigate('/index/earn-money') }} />
                </div>
              </div>

              <Button
                className="h-10 w-full bg-selected dark:bg-charcoal rounded-lg border-acc dark:border-selected border mt-3 gap-0 text-left"
                onPress={() => { onClose(); navigate('/search-games') }}
              >
                <SearchIcon className="text-sec mr-3" />
                <div className="flex-1 text-sec text-sm">{t('common.label.search')} {t('common.label.games.label')}</div>
              </Button>

              <div className="flex justify-between items-center mt-3 mb-2">
                <div className="flex items-center">
                  <HomeSpriteIcon pos="recentIcon" className="size-5 mr-2" />
                  {t('common.label.recent')}
                </div>
                <Button
                  className="h-6 px-3 flex items-center border border-white/20 bg-selected rounded-sm text-xs text-sec font-bold gap-0"
                  onPress={() => { onClose(); withAuth(() => navigate('/gamelist/recent')) }}
                >
                  {t('common.label.all')}
                  <ChevronRight className="size-3! ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2 h-26.5">
                {recentGames.map((g: any, idx: number) =>
                  g ? (
                    <Button
                      key={idx}
                      className="h-full rounded bg-selected p-0"
                      onPress={() => { onClose(); navigate(`/partner-page/casino?url=${encodeURIComponent(g.gameUrl || '')}&gameCode=${encodeURIComponent(g.gameCode || '')}&title=${encodeURIComponent(g.gameName || '')}`) }}
                    >
                      <GameImage
                        src={g.verticalPic || g.gamePic}
                        classNames={{ wrapper: 'size-full max-w-none! rounded', img: 'size-full rounded z-0' }}
                      />
                    </Button>
                  ) : (
                    <div key={idx} />
                  ),
                )}

                {recentGames.length === 0 && (
                  <div className="col-span-4 flex flex-col items-center justify-center">
                    <p className="text-sm text-main font-bold">
                      {t('common.tip.info.noSthYet', { sth: t('common.label.recent') })}
                    </p>
                    {!token && (
                      <p className="text-xs text-sec">
                        {t('common.tip.info.loginFirst')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-3 mb-2">
                <div className="flex items-center">
                  <HomeSpriteIcon pos="collectIcon" className="size-5 mr-2" />
                  {t('common.label.favorites')}
                </div>
                <Button
                  className="h-6 px-3 flex items-center border border-white/20 bg-selected rounded-sm text-xs text-sec font-bold gap-0"
                  onPress={() => { onClose(); withAuth(() => navigate('/gamelist/favorites')) }}
                >
                  {t('common.label.all')}
                  <ChevronRight className="size-3! ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2 h-26.5">
                {favoriteGames.map((g: any, idx: number) =>
                  g ? (
                    <Button
                      key={idx}
                      className="h-full rounded bg-selected p-0"
                      onPress={() => { onClose(); navigate(`/partner-page/casino?url=${encodeURIComponent(g.gameUrl || '')}&gameCode=${encodeURIComponent(g.gameCode || '')}&title=${encodeURIComponent(g.gameName || '')}`) }}
                    >
                      <GameImage
                        src={g.verticalPic || g.gamePic}
                        classNames={{ wrapper: 'size-full max-w-none! rounded', img: 'size-full rounded z-0' }}
                      />
                    </Button>
                  ) : (
                    <div key={idx} />
                  ),
                )}

                {favoriteGames.length === 0 && (
                  <div className="col-span-4 flex flex-col items-center justify-center">
                    <p className="text-sm text-main font-bold">
                      {t('common.tip.info.noSthYet', { sth: t('common.label.favorites') })}
                    </p>
                    {!token && (
                      <p className="text-xs text-sec">
                        {t('common.tip.info.loginFirst')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-selected">

              <DrawerMenuItem
                icon={<ThemeIcon className="mr-4 rtl:mr-0 rtl:ml-4" />}
                rightNode={
                  <Switch
                    isSelected={isDarkMode}
                    onValueChange={toggleDarkMode}
                    classNames={{
                      wrapper: 'bg-light-gray group-data-[selected=true]:bg-charcoal',
                      thumb: 'bg-white group-data-[selected=true]:bg-selected',
                    }}
                    thumbIcon={({ isSelected }: { isSelected: boolean }) =>
                      isSelected ? <MoonIcon /> : <SunIcon />
                    }
                  />
                }
                hiddenArrow
              >
                {t('me.list.theme')}
              </DrawerMenuItem>

              <BottomSheetSelect
                list={LANGUAGE_OPTIONS}
                value={i18n.language}
                onValueChange={(lang: string) => {
                  i18n.changeLanguage(lang)
                  localStorage.setItem('lang', lang)
                }}
                sheetHeaderTitle={t('common.label.switchLanguage')}
                className="my-2"
              >
                <DrawerMenuItem
                  icon={<LanguageIcon className="mr-4 rtl:mr-0 rtl:ml-4" />}
                  rightNode={<>{LANGUAGE_NAME_MAP[i18n.language] || 'English'}</>}
                >
                  {t('me.list.languages')}
                </DrawerMenuItem>
              </BottomSheetSelect>

              {chatEnabled && (
                <DrawerMenuItem
                  icon={<CustomerServiceIcon className="mr-4 rtl:mr-0 rtl:ml-4" />}
                  onClick={() => openCustomerService()}
                  rightNode={<CsPingDot />}
                >
                  {t('me.list.service')}
                </DrawerMenuItem>
              )}

              <NavBarSpacer />
            </div>
        </DrawerContent>
      </Drawer>
      <GiftCodeDialog isOpen={showGiftCode} onClose={() => setShowGiftCode(false)} />
    </>
  )
}
