import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Image, Modal, ModalContent, Switch } from '@nextui-org/react'
import { motion, useScroll, useTransform } from 'framer-motion'
import clsx from 'clsx'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { useNotificationStore } from '../stores/notificationStore'
import { useAppConfigStore } from '../stores/configStore'
import { useChatStore } from '../stores/chatStore'
import { getUserInfo, getUserWallet, type UserWalletDto } from '../services/userApi'
import { formatCurrency } from '../utils/format'
import { toast } from '../utils/toast'
import { resolveAvatarUrl } from '../utils/helpers'
import { GiftCodeDialog } from '../components/shared/GiftCodeDialog'
import { Spin } from '../components/shared/Spin'
import { BottomSheetSelect } from '../components/shared/BottomSheetSelect'
import { LANGUAGE_OPTIONS, LANGUAGE_NAME_MAP } from '../i18n'
import './me-page.css'

const unknownAvatar = '/images/common/unkonw-avatar.svg'

const ChevronRight = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 14 14" className={clsx('size-3.5', className)} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const PhoneIcon = ({ className, ...rest }: { className?: string } & React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" className={clsx('size-4 text-svg-gray', className)} fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <path d="M11.5714 1H4.42857C3.63959 1 3 1.6268 3 2.4V13.6C3 14.3732 3.63959 15 4.42857 15H11.5714C12.3604 15 13 14.3732 13 13.6V2.4C13 1.6268 12.3604 1 11.5714 1Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 12H8.00667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

const NotifBadge = () => {
  const notifUnread = useNotificationStore((s) => s.notifUnread)
  if (notifUnread <= 0) return null
  return (
    <div className="min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-danger text-white text-8 font-bold leading-none">
      {notifUnread > 99 ? '99+' : notifUnread}
    </div>
  )
}

const NotificationBellIcon = () => (
  <svg className="size-5 shrink-0 text-svg-gray" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22zm6.5-6V11a6.5 6.5 0 00-5-6.32V4a1.5 1.5 0 00-3 0v.68A6.5 6.5 0 005.5 11v5l-1.7 1.7a1 1 0 00.7 1.7h15a1 1 0 00.7-1.7L18.5 16z"
      fill="currentColor"
    />
  </svg>
)

const CommunityChatIcon = () => (
  <svg className="size-5 shrink-0 text-svg-gray" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5 4h14a2 2 0 012 2v9a2 2 0 01-2 2H9l-4 3.5V17H5a2 2 0 01-2-2V6a2 2 0 012-2zm3 5.25a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 100 2 1 1 0 000-2z"
      fill="currentColor"
    />
  </svg>
)

const ThemeIcon = ({ className, ...rest }: { className?: string } & React.SVGProps<SVGSVGElement>) => (
  <svg className={clsx('size-5', className)} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <path d="M8.23926 4.50391C8.02118 5.10629 7.90137 5.75595 7.90137 6.43359C7.90137 9.56434 10.4396 12.1024 13.5703 12.1025C14.2479 12.1025 14.8977 11.9827 15.5 11.7646C14.7106 13.9455 12.6222 15.5039 10.1689 15.5039C7.0381 15.5039 4.5 12.9658 4.5 9.83496C4.50014 7.38188 6.0586 5.29333 8.23926 4.50391Z" fill="#A2A5A5" />
    <circle cx="10" cy="10" r="8.22" stroke="#A2A5A5" strokeWidth="1.56" />
    <path d="M12.6188 5.48443C13.3707 5.9205 14.0018 6.53742 14.4549 7.27921" stroke="var(--basic-color-primary)" strokeWidth="1.56" strokeLinecap="round" />
  </svg>
)

const SunIcon = ({ className }: { className?: string }) => (
  <svg className={clsx('size-4', className)} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_19189_15550)">
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
      <clipPath id="clip0_19189_15550">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
)

const MoonIcon = ({ className }: { className?: string }) => (
  <svg className={clsx('size-4', className)} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.75781 1.00195C5.48018 1.76874 5.3291 2.59637 5.3291 3.45898C5.32922 7.44382 8.56006 10.6738 12.5449 10.6738C13.4071 10.6738 14.2335 10.5216 15 10.2441C13.9952 13.0199 11.3374 15.0039 8.21484 15.0039C4.22992 15.0039 0.999023 11.773 0.999023 7.78809C0.999191 4.66605 2.98261 2.00692 5.75781 1.00195Z" fill="white" />
  </svg>
)

const WalletIcon = () => (
  <svg className="size-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 5.33333V3C13 2.44772 12.5523 2 12 2H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44771 14 3 14H12C12.5523 14 13 13.5523 13 13V10.6667" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M12.9997 5.33398H8.33301C7.78072 5.33398 7.33301 5.7817 7.33301 6.33398V9.66732C7.33301 10.2196 7.78072 10.6673 8.33301 10.6673H12.9997C13.552 10.6673 13.9997 10.2196 13.9997 9.66732V6.33398C13.9997 5.7817 13.552 5.33398 12.9997 5.33398Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M9.33366 7.99935C9.33366 7.63116 9.63214 7.33268 10.0003 7.33268C10.3685 7.33268 10.667 7.63116 10.667 7.99935C10.667 8.36754 10.3685 8.66602 10.0003 8.66602C9.63214 8.66602 9.33366 8.36754 9.33366 7.99935Z" fill="currentColor" />
  </svg>
)

const RechargeBalanceIcon = ({ className }: { className?: string }) => (
  <svg className={clsx('size-4', className)} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.6673 7.99935V11.3327C14.6673 12.4373 13.7719 13.3327 12.6673 13.3327H3.33398C2.22941 13.3327 1.33398 12.4373 1.33398 11.3327V4.66602C1.33398 3.56145 2.22941 2.66602 3.33398 2.66602H8.00065" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M1 6H7.4C7.73137 6 8 6.26863 8 6.6C8 6.93137 7.73137 7.2 7.4 7.2H1V6Z" fill="currentColor" />
    <rect x="3.33398" y="10" width="2.66667" height="1.2" rx="0.6" fill="currentColor" />
    <rect x="7.33398" y="10" width="2.66667" height="1.2" rx="0.6" fill="currentColor" />
    <rect x="10" y="4" width="5" height="1.2" rx="0.6" fill="currentColor" />
    <rect x="11.9004" y="7.09961" width="5" height="1.2" rx="0.6" transform="rotate(-90 11.9004 7.09961)" fill="currentColor" />
  </svg>
)

const WithdrawBalanceIcon = ({ className }: { className?: string }) => (
  <svg className={clsx('size-4', className)} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.4793 8.02333C14.4793 11.6002 11.5797 14.4998 8.00282 14.4998C4.42597 14.4998 1.52637 11.6002 1.52637 8.02333C1.52637 4.44648 4.42597 1.54688 8.00282 1.54688" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M8.58301 4.02246V4.81055C8.99529 4.90703 9.3261 5.10591 9.57227 5.41016C9.82651 5.71792 9.96806 6.11736 10.001 6.60449L10.0049 6.6582H8.75977L8.75586 6.6123C8.73049 6.3397 8.65483 6.15314 8.53809 6.04199L8.53711 6.04102C8.42027 5.92418 8.24058 5.86134 7.98926 5.86133C7.75864 5.86133 7.58823 5.92349 7.4707 6.04102L7.46973 6.04199C7.35306 6.15295 7.29102 6.31635 7.29102 6.54004C7.29106 6.73667 7.34913 6.88421 7.45996 6.98926C7.57273 7.09609 7.7625 7.17741 8.03711 7.22852V7.22949L8.59082 7.33594C9.08342 7.42789 9.45778 7.61607 9.70703 7.90527C9.96342 8.19539 10.0889 8.59089 10.0889 9.08496C10.0889 9.61171 9.95387 10.0392 9.67871 10.3613C9.41235 10.6731 9.04547 10.8737 8.58301 10.9697V11.8936H7.48242V10.9912C7.00712 10.9133 6.6277 10.715 6.34863 10.3906L6.34766 10.3896C6.06075 10.0492 5.90622 9.60404 5.87988 9.05859L5.87695 9.00586H7.09082L7.09668 9.0498C7.13476 9.36713 7.22534 9.58253 7.36035 9.70703C7.50324 9.8261 7.72018 9.88965 8.01855 9.88965C8.29021 9.88962 8.48488 9.82842 8.61133 9.71387C8.7368 9.60006 8.80363 9.42594 8.80371 9.18262C8.80371 8.96341 8.75062 8.80522 8.65234 8.70117L8.65137 8.7002C8.5516 8.58886 8.38575 8.50815 8.14551 8.46387L7.66895 8.37695V8.37598C7.11945 8.27776 6.70307 8.09065 6.42773 7.80859V7.80762C6.15788 7.51752 6.02539 7.12169 6.02539 6.62695C6.02544 6.13838 6.15796 5.73155 6.42578 5.41016C6.68532 5.09871 7.03862 4.89612 7.48242 4.7998V4.02246H8.58301Z" fill="currentColor" stroke="currentColor" strokeWidth="0.1" />
    <rect x="10.7979" y="0.900391" width="3.88587" height="1.2" rx="0.6" fill="currentColor" />
    <rect x="13.6318" y="4.78516" width="3.88587" height="1.2" rx="0.6" transform="rotate(-90 13.6318 4.78516)" fill="currentColor" />
    <rect x="10.5264" y="4.35156" width="5.18116" height="1.2" rx="0.6" transform="rotate(-45 10.5264 4.35156)" fill="currentColor" />
  </svg>
)

const InfoIcon = ({ className, onClick, ...rest }: { className?: string; onClick?: () => void } & React.SVGProps<SVGSVGElement>) => (
  <svg className={clsx('size-4', className)} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" onClick={onClick} {...rest}>
    <circle cx="8" cy="8" r="8" fill="white" fillOpacity="0.8" />
    <circle cx="8" cy="8" r="7.5" stroke="white" strokeOpacity="0.3" />
    <rect x="7.5" y="4" width="1" height="6" fill="#5F6975" />
    <rect x="7.5" y="11" width="1" height="1" fill="#5F6975" />
  </svg>
)

const RefreshIcon = ({ className, onClick, spinning }: { className?: string; onClick?: () => void; spinning?: boolean }) => (
  <div
    className={clsx('size-6 text-main size-6! bg-black/10 rounded-full text-white!', className)}
    data-spinning={spinning ? 'true' : undefined}
    onClick={onClick}
  >
    <svg className="size-full" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M29 12V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 20V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M29 20C29 15.0294 24.9706 11 20 11C17.4573 11 15.1608 12.0545 13.5241 13.75M11 20C11 24.9706 15.0294 29 20 29C22.4278 29 24.6311 28.0387 26.25 26.476" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
)

const MenuIcon = ({ src, alt }: { src: string; alt: string }) => (
  <Image
    src={src}
    alt={alt}
    classNames={{ img: 'size-full rounded-sm', wrapper: 'size-5 rounded-sm shrink-0' }}
  />
)

const UpdateIcon = ({ className, ...rest }: { className?: string } & React.SVGProps<SVGSVGElement>) => (
  <svg className={clsx('size-5', className)} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <path d="M17.5005 2.92969C17.9432 2.92969 18.3338 3.09247 18.6721 3.41802C19.0105 3.74358 19.1796 4.12774 19.1796 4.57052V16.2505C19.1796 16.6933 19.0105 17.0839 18.6721 17.4222C18.3338 17.7605 17.9432 17.9297 17.5005 17.9297H2.50046C2.05768 17.9297 1.66712 17.7605 1.32879 17.4222C0.990456 17.0839 0.821289 16.6933 0.821289 16.2505V4.57052C0.821289 4.12774 0.990456 3.74358 1.32879 3.41802C1.66712 3.09247 2.05768 2.92969 2.50046 2.92969H7.50046V4.57052H2.50046V16.2505H17.5005V4.57052H12.5005V2.92969H17.5005Z" fill="#A2A5A5" />
    <path d="M6.67969 10.4297L9.99969 13.7497L13.3205 10.4297H10.8205V2.92969H9.17969V10.4297H6.67969Z" fill="var(--basic-color-primary)" />
  </svg>
)

const PingDot = ({ ping, className }: { ping?: boolean; className?: string }) => {
  if (!ping) return null
  return (
    <div className={clsx('relative', className)}>
      <div className="size-2.5 border border-white bg-danger rounded-full animate-ping absolute left-0 top-0" />
      <div className="size-2.5 border border-white bg-danger rounded-full" />
    </div>
  )
}

const HotBadge = () => (
  <div className="px-1.5 py-0.5 text-8 rounded-full flex items-center justify-center text-white bg-tip">HOT</div>
)

const RechargeActionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="8.5" width="18" height="11.5" rx="2.4" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 12.5H21" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 2V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9.5 4.8L12 7.3L14.5 4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const WithdrawActionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="8.5" width="18" height="11.5" rx="2.4" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 12.5H21" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 7.3V2.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9.5 4.8L12 2.3L14.5 4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CrownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8.2L6.6 11.4L12 5L17.4 11.4L21 8.2L19.4 17.5H4.6L3 8.2Z" fill="currentColor" fillOpacity="0.92" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M4.6 20H19.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const VipLevelBadge = ({ level }: { level: number }) => (
  <div
    className="bg-no-repeat w-13 h-5 shrink-0"
    style={{
      backgroundImage: 'url(/images/vip/vip-level-sprite.webp)',
      backgroundSize: '36.54rem 5.4rem',
      backgroundPosition: `${-level * 4.625}rem -2.43rem`,
    }}
  />
)

const MenuItem = ({ icon, children, link, onClick, needLogin, rightNode, hiddenArrow }: {
  icon?: React.ReactNode
  children: React.ReactNode
  link?: string
  onClick?: () => void
  needLogin?: boolean
  rightNode?: React.ReactNode
  hiddenArrow?: boolean
}) => {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)

  const handleClick = () => {
    if (needLogin && !token) {
      navigate('/login')
      return
    }
    if (onClick) onClick()
    else if (link) navigate(link)
  }

  return (
    <div className="me-row" onClick={handleClick}>
      {icon && <div className="me-row-ico">{icon}</div>}
      <div className="me-row-label">{children}</div>
      {rightNode}
      {!hiddenArrow && <ChevronRight className="me-chev ml-2 size-3.5 rtl:ml-0 rtl:mr-2 rtl:rotate-180" />}
    </div>
  )
}

const WalletBalanceRow = ({ icon, bicon, label, tipKey, value, isLoggedIn }: {
  icon: React.ReactNode
  bicon: React.ReactNode
  label: string
  tipKey: string
  value: string
  isLoggedIn: boolean
}) => {
  const { t } = useTranslation()
  const [showTip, setShowTip] = useState(false)

  return (
    <>
      <div className="me-stat">
        <div className="me-stat-top">
          <span className="me-stat-ico">{icon}</span>
          <p className="me-stat-label">{t(label)}</p>
          <InfoIcon className="me-stat-info" onClick={() => setShowTip(true)} />
        </div>
        <div className="me-stat-value din">
          {isLoggedIn ? value : '******'}
        </div>
      </div>
      <Modal
        placement="center"
        backdrop="opaque"
        classNames={{ base: 'color m-0 rounded-xl' }}
        radius="none"
        isOpen={showTip}
        onOpenChange={(v) => { if (!v) setShowTip(false) }}
        hideCloseButton
      >
        <ModalContent className="w-82 p-6">
          <div className="flex items-center mb-3">
            {bicon}
            <div className="ml-2 text-main text-base dark:text-main/80">{t(label)}</div>
          </div>
          <div className="text-acc text-sm">{t(tipKey)}</div>
        </ModalContent>
      </Modal>
    </>
  )
}

export const MePage = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showGiftCode, setShowGiftCode] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [walletInfo, setWalletInfo] = useState<UserWalletDto | null>(null)
  const token = useAuthStore((s) => s.token)
  const userInfo = useAuthStore((s) => s.userInfo)
  const setUserInfo = useAuthStore((s) => s.setUserInfo)
  const balance = useAuthStore((s) => s.balance)
  const removeToken = useAuthStore((s) => s.removeToken)
  const { isDarkMode } = useUIStore()
  const scale = useUIStore((s) => s.scale)
  const statusBarHeight = useUIStore((s) => s.statusBarHeight)

  const scrollRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ container: scrollRef })

  const paddingY = useTransform(scrollYProgress, [0, 1], [20 * scale, 6 * scale])
  const avatarSize = useTransform(scrollYProgress, [0, 1], [64 * scale, 32 * scale])
  const marginLeft = useTransform(scrollYProgress, [0, 1], [16 * scale, 8 * scale])
  const infoScale = useTransform(scrollYProgress, [0, 1], [1, 0])
  const infoHeight = useTransform(scrollYProgress, [0, 1], [24 * scale, 0])
  const infoPaddingTop = useTransform(scrollYProgress, [0, 1], [8 * scale, 0])
  const headerShadow = useTransform(scrollYProgress, [0, 1], ['0px 0px 0px 0px rgba(0, 0, 0, 0.10)', '0px 4px 16px 0px rgba(0, 0, 0, 0.10)'])
  const signinColor = useTransform(scrollYProgress, [0, 1], isDarkMode ? ['#b3bec1', '#fff'] : ['#535353', '#2c2c2c'])
  const loginBtnHeight = useTransform(scrollYProgress, [0, 1], [36, 0])

  const refreshData = (showLoader = true) => {
    if (!token) return
    if (showLoader) setLoading(true)
    setRefreshing(true)
    Promise.all([getUserInfo(), getUserWallet()]).then(([info, wallet]) => {
      if (info) setUserInfo(info)
      if (wallet) {
        setWalletInfo(wallet)
        useAuthStore.setState({
          balance: wallet.balance ?? 0,
          bonusBalance: wallet.bonusBalance ?? 0,
          isRecharge: wallet.isRecharge ?? null,
        })
      }
    }).finally(() => { setLoading(false); setRefreshing(false) })
  }

  useEffect(() => {
    refreshData(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', isDarkMode ? 'light' : 'dark')
  }

  const handleLogout = () => {
    removeToken()
    navigate('/', { replace: true })
  }

  const isLoggedIn = !!(token && userInfo)
  const vipEnabled = useAppConfigStore((s) => s.vipEnabled)
  const chatEnabled = useAppConfigStore((s) => s.support.chatEnabled)
  const groupChatEnabled = useAppConfigStore((s) => s.groupChatEnabled)
  const openCommunityChat = useChatStore((s) => s.openPanel)

  return (
    <Spin loading={loading} className="me-root h-full w-full flex flex-col relative" style={{ paddingTop: statusBarHeight }}>

      <div className="me-hero w-full h-108 absolute left-0 top-0 z-0 pointer-events-none" />

      <motion.div
        onClick={() => { navigate(isLoggedIn ? '/profile' : '/login') }}
        className="flex items-center px-3 relative z-20"
        style={{ paddingTop: paddingY, paddingBottom: paddingY, boxShadow: headerShadow }}
      >
        <div className="flex flex-1 flex-row items-center text-main">
          <motion.div className="me-avatar shrink-0" style={{ height: avatarSize, width: avatarSize }}>
            <Image
              classNames={{
                wrapper: 'size-full rounded-full overflow-hidden max-w-none!',
                img: 'size-full object-cover',
              }}
              alt="avatar"
              src={isLoggedIn ? resolveAvatarUrl(userInfo?.avatar) : unknownAvatar}
            />
          </motion.div>
          <motion.div className="flex flex-col justify-center" style={{ marginLeft }}>
            {isLoggedIn ? (
              <>
                <div className="flex items-center">
                  <p className="font-bold text-sm text-white mr-2">{userInfo?.nickName}</p>
                  {userInfo?.vipLevel !== undefined && <VipLevelBadge level={userInfo.vipLevel} />}
                </div>
                <motion.div
                  className="flex items-center gap-2 text-xs text-white overflow-hidden origin-left"
                  style={{ scale: infoScale, height: infoHeight, paddingTop: infoPaddingTop }}
                >
                  <span className="me-chip">
                    <PhoneIcon className="size-3.5! text-white!" />
                    {userInfo?.phone ?? t('common.label.unbound')}
                  </span>
                  <span className="me-chip">ID: {userInfo?.inviteCode ?? userInfo?.userID}</span>
                </motion.div>
              </>
            ) : (
              <>
                <motion.p className="text-xs" style={{ color: signinColor }}>{t('me.tip.signin')}</motion.p>
                <motion.div className="origin-left" style={{ scale: infoScale, height: loginBtnHeight }}>
                  <Button
                    onPress={() => navigate('/login')}
                    className="me-login-btn mt-1"
                  >
                    {t('common.label.login')}
                  </Button>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
        <ChevronRight className="size-3.5! text-sec" />
      </motion.div>

      <div ref={scrollRef} className="flex flex-1 flex-col pb-40 overflow-y-auto overflow-x-hidden relative z-10">

        <div className="p-3 pt-0">

          <div className="me-wallet me-sec me-sec-1 relative z-10">
            <span className="me-sheen" />

            <div className="me-wallet-hd">
              <span className="me-wallet-label">
                <WalletIcon />
                {t('me.wallet.title')}
              </span>
              <RefreshIcon className="me-refresh" spinning={refreshing} onClick={() => refreshData(false)} />
            </div>

            <p className="me-wallet-amount din">
              {isLoggedIn ? formatCurrency(balance) : '********'}
            </p>

            <div className="me-stats">
              <WalletBalanceRow
                icon={<RechargeBalanceIcon className="text-white" />}
                bicon={<RechargeBalanceIcon className="text-sec" />}
                label="me.wallet.balance"
                tipKey="me.tip.wallet.balance"
                value={formatCurrency(walletInfo?.rechargeBalance ?? 0)}
                isLoggedIn={isLoggedIn}
              />
              <WalletBalanceRow
                icon={<WithdrawBalanceIcon className="text-white" />}
                bicon={<WithdrawBalanceIcon className="text-sec" />}
                label="me.wallet.amount"
                tipKey="me.tip.wallet.amount"
                value={formatCurrency(walletInfo?.withdrawBalance ?? 0)}
                isLoggedIn={isLoggedIn}
              />
            </div>
          </div>

        </div>

        <div className="px-3">
          <div className="me-quick me-sec me-sec-2">
            <button
              type="button"
              className="me-quick-btn me-quick-recharge"
              onClick={() => { if (isLoggedIn) navigate('/recharge'); else navigate('/login') }}
            >
              <span className="me-quick-ico"><RechargeActionIcon /></span>
              <span className="me-quick-label">{t('common.label.recharge')}</span>
              <ChevronRight className="me-quick-chev size-3.5 rtl:rotate-180" />
            </button>
            <button
              type="button"
              className="me-quick-btn me-quick-withdraw"
              onClick={() => { if (isLoggedIn) navigate('/withdraw'); else navigate('/login') }}
            >
              <span className="me-quick-ico"><WithdrawActionIcon /></span>
              <span className="me-quick-label">{t('common.label.withdraw')}</span>
              <ChevronRight className="me-quick-chev size-3.5 rtl:rotate-180" />
            </button>
          </div>

          {vipEnabled && (
            <button
              type="button"
              className="me-vip-card me-sec me-sec-2 mt-3"
              onClick={() => { if (isLoggedIn) navigate('/vip'); else navigate('/login') }}
            >
              <span className="me-vip-ico"><CrownIcon /></span>
              <span className="me-vip-title">{t('vip.title')}</span>
              {isLoggedIn && userInfo?.vipLevel !== undefined && <VipLevelBadge level={userInfo.vipLevel} />}
              <ChevronRight className="me-vip-chev size-3.5 rtl:rotate-180" />
            </button>
          )}

          <div className="my-3">
            <div className="me-card me-sec me-sec-3">
              <MenuItem
                icon={<MenuIcon src="/images/me-list-item/gift.webp" alt="giftCode" />}
                rightNode={<HotBadge />}
                onClick={() => setShowGiftCode(true)}
                needLogin
              >
                {t('me.list.giftCode')}
              </MenuItem>
              <MenuItem icon={<MenuIcon src="/images/me-list-item/agency-center.webp" alt="referral" />} link="/agent" needLogin>
                {t('me.list.referralCommission')}
              </MenuItem>
              <MenuItem icon={<MenuIcon src="/images/me-list-item/transfer.webp" alt="transfer" />} link="/transfer" needLogin>
                {t('common.label.transfer')}
              </MenuItem>
              <MenuItem icon={<MenuIcon src="/images/me-list-item/history.webp" alt="resultHistory" />} link="/result">
                {t('common.label.resultHistory')}
              </MenuItem>
              <MenuItem icon={<MenuIcon src="/images/me-list-item/my-bets.webp" alt="myBets" />} link="/my-bets" needLogin>
                {t('common.label.games.myBets')}
              </MenuItem>
              <MenuItem icon={<MenuIcon src="/images/me-list-item/rebate.webp" alt="rebate" />} link="/rebate" needLogin>
                {t('common.label.rebate')}
              </MenuItem>
              <MenuItem icon={<MenuIcon src="/images/me-list-item/my-transactions.webp" alt="transactions" />} link="/transactions" needLogin>
                {t('me.list.transactions')}
              </MenuItem>
              <MenuItem icon={<NotificationBellIcon />} link="/notifications" needLogin rightNode={<NotifBadge />}>
                {t('common.label.notifications')}
              </MenuItem>
            </div>

            <div className="me-card me-sec me-sec-4 mt-3">
              <MenuItem
                icon={<ThemeIcon />}
                hiddenArrow
                rightNode={
                  <Switch
                    isSelected={isDarkMode}
                    onValueChange={toggleDarkMode}
                    classNames={{ wrapper: 'bg-light-gray group-data-[selected=true]:bg-charcoal', thumb: 'bg-white group-data-[selected=true]:bg-selected' }}
                    thumbIcon={({ isSelected }: { isSelected: boolean }) => isSelected ? <MoonIcon /> : <SunIcon />}
                  />
                }
              >
                {t('me.list.theme')}
              </MenuItem>
              <BottomSheetSelect
                list={LANGUAGE_OPTIONS}
                value={i18n.language}
                onValueChange={(lang: string) => {
                  i18n.changeLanguage(lang)
                  localStorage.setItem('lang', lang)
                }}
                sheetHeaderTitle={t('common.label.switchLanguage')}
              >
                <div className="my-2">
                  <MenuItem
                    icon={<MenuIcon src="/images/me-list-item/languages.webp" alt="languages" />}
                    rightNode={<span className="text-xs text-sec-acc mr-1">{LANGUAGE_NAME_MAP[i18n.language] || 'English'}</span>}
                  >
                    {t('me.list.languages')}
                  </MenuItem>
                </div>
              </BottomSheetSelect>
              {chatEnabled && (
                <MenuItem
                  icon={<MenuIcon src="/images/me-list-item/customer-service.webp" alt="customerService" />}
                  onClick={() => window.dispatchEvent(new CustomEvent('openCustomerService'))}
                  rightNode={<CsPingDot />}
                >
                  {t('me.list.service')}
                </MenuItem>
              )}
              {groupChatEnabled && (
                <MenuItem
                  icon={<CommunityChatIcon />}
                  onClick={() => openCommunityChat()}
                  needLogin
                >
                  {t('me.list.communityChat', { defaultValue: 'Community Chat' })}
                </MenuItem>
              )}

              {(() => {
                const versionCode = localStorage.getItem('versionCode')
                if (!versionCode) return null
                const LATEST_VERSION = '101'
                const needUpdate = parseInt(versionCode) < parseInt(LATEST_VERSION)
                return (
                  <MenuItem
                    icon={<UpdateIcon />}
                    rightNode={
                      <div className="text-sec-acc flex items-center">
                        {versionCode.split('').join('.')}
                        <div className="w-7 flex justify-end">
                          {needUpdate && <PingDot ping />}
                        </div>
                      </div>
                    }
                    hiddenArrow
                    onClick={() => {
                      if (needUpdate) {

                        const nexuses = (window as Window & { nexuses?: { openURL?: (url: string) => void } }).nexuses
                        if (nexuses?.openURL) {
                          const host = location.origin.split('//')[1].split('.').reverse()
                          const channel = localStorage.getItem('channel') || 'keralaluckydraw'
                          const apkName = channel === 'keralaluckydraw' ? 'keralaluckydraw-app' : `keralaluckydraw-app-${channel}`
                          const url = `${location.protocol}//pic.${host[1]}.${host[0]}/hadis/apk/keralaluckydraw/${apkName}.${LATEST_VERSION}.apk?reqDate=${Date.now()}`
                          nexuses.openURL(url)
                        } else {

                          const host = location.origin.split('//')[1].split('.').reverse()
                          const channel = localStorage.getItem('channel') || 'keralaluckydraw'
                          const apkName = channel === 'keralaluckydraw' ? 'keralaluckydraw-app' : `keralaluckydraw-app-${channel}`
                          const url = `${location.protocol}//pic.${host[1]}.${host[0]}/hadis/apk/keralaluckydraw/${apkName}.${LATEST_VERSION}.apk?reqDate=${Date.now()}`
                          const link = document.createElement('a')
                          link.download = apkName
                          link.href = url
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }
                      } else {
                        toast.success('The current version is already the latest version')
                      }
                    }}
                  >
                    {t('me.list.update')}
                  </MenuItem>
                )
              })()}
            </div>
          </div>

          {token && (
            <div className="me-logout mb-5" onClick={() => setShowLogoutConfirm(true)}>
              {t('me.list.logout')}
            </div>
          )}
        </div>

        <div className="w-full h-(--nav-bar-height) shrink-0 bg-gray" />
      </div>

      <GiftCodeDialog isOpen={showGiftCode} onClose={() => setShowGiftCode(false)} />

      <Modal
        isOpen={showLogoutConfirm}
        onOpenChange={(v) => { if (!v) setShowLogoutConfirm(false) }}
        placement="center"
        backdrop="blur"
        isDismissable={false}
        classNames={{ base: 'color m-0 w-[16.875rem] rounded-[0.875rem] bg-light-gray dark:bg-gray' }}
        hideCloseButton
      >
        <ModalContent className="p-0">
          <div className="py-5 px-4 text-center">
            <h3 className="text-base font-bold text-main mb-2">{t('me.list.logout')}</h3>
            <p className="text-sm text-acc">{t('me.list.logoutTip')}</p>
          </div>
          <div className="flex border-t border-gray dark:border-selected">
            <Button
              className="flex-1 h-12 bg-transparent text-main font-bold rounded-none border-r border-gray dark:border-selected"
              onPress={() => setShowLogoutConfirm(false)}
            >
              {t('common.label.cancel')}
            </Button>
            <Button
              className="flex-1 h-12 bg-transparent text-primary font-bold rounded-none"
              onPress={() => {
                setShowLogoutConfirm(false)
                handleLogout()
              }}
            >
              {t('common.label.confirm')}
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </Spin>
  )
}

export default MePage
