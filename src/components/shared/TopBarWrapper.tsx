import { useMemo, memo } from 'react'
import clsx from 'clsx'
import { TopBar } from './TopBar'
import { BalanceDisplay } from './BalanceDisplay'
import { useNotificationStore } from '../../stores/notificationStore'

const HeadsetIcon = ({ className = 'size-6 text-main' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20.7225 10.5819C20.6641 5.81223 16.784 1.96265 12 1.96265C7.21607 1.96265 3.33597 5.81223 3.2774 10.5819C2.4767 11.222 1.96265 12.2049 1.96265 13.3093C1.96265 15.2371 3.52586 16.8007 5.4539 16.8007C6.29528 16.8007 7.06682 16.5025 7.66954 16.0072L6.02469 9.8684C5.83839 9.83807 5.64864 9.81789 5.45392 9.81789C5.32562 9.81789 5.19951 9.82583 5.07463 9.83959C5.49543 6.38608 8.43247 3.70832 12.0001 3.70832C15.5673 3.70832 18.5048 6.38605 18.9255 9.83959C18.8011 9.82593 18.6746 9.81789 18.5462 9.81789C18.3516 9.81789 18.1614 9.83811 17.975 9.8684L16.3306 16.0044C16.7958 16.3863 17.3614 16.6503 17.982 16.7513C17.1584 17.6361 16.1111 18.3101 14.9263 18.6747L14.7818 18.819C14.4122 18.1396 13.7008 17.6731 12.873 17.6731C11.6677 17.6731 10.6909 18.6498 10.6909 19.8556C10.6909 21.061 11.6676 22.0377 12.873 22.0377C13.8623 22.0377 14.6875 21.3751 14.9555 20.473C17.3637 19.8827 19.3811 18.2974 20.54 16.1727C21.4445 15.5418 22.0376 14.4955 22.0376 13.3092C22.0375 12.2051 21.523 11.2219 20.7227 10.5818L20.7225 10.5819Z"
      fill="currentColor"
    />
  </svg>
)

const NotifDot = ({ className }: { className?: string }) => (
  <div className={clsx('size-2.5 border border-white bg-danger rounded-full', className)} />
)

const PingDot = ({ className, ping, wapperClassName }: { className?: string; ping?: boolean; wapperClassName?: string }) =>
  ping ? (
    <div className={clsx('relative', wapperClassName)}>
      <NotifDot className={clsx('animate-ping absolute left-0 top-0', className)} />
      <NotifDot className={className} />
    </div>
  ) : (
    <NotifDot className={className} />
  )

const CsPingDot = ({ className, wapperClassName }: { className?: string; wapperClassName?: string }) => {
  const unreaderCSmsg = useNotificationStore((s) => s.unreaderCSmsg)
  if (!unreaderCSmsg) return <></>
  return <PingDot className={className} wapperClassName={wapperClassName} ping />
}

const openCS = (customAttr?: any) => {
  const win = window as any
  if (!win.ssq) {
    setTimeout(() => openCS(customAttr), 200)
    return
  }
  const userInfo = (() => {
    const raw = localStorage.getItem('userInfo')
    if (raw) {
      try { return JSON.parse(raw) } catch { return {} }
    }
    return {}
  })()

  if (userInfo.userID) {
    win.ssq?.push?.('setLoginInfo', {
      user_id: userInfo.userID + '',
      user_name: userInfo.userID + '',
      phone: localStorage.getItem('userPhone') || userInfo.phone,
      email: userInfo.email,
      custom_fields_ext: {
        userID: userInfo.userID,
        userName: userInfo.nickName,
        lang: localStorage.getItem('lang') || 'en-US',
        originLang: navigator.language,
        ...customAttr,
      },
    })
  } else {
    win.ssq?.push?.('clearUser')
    win.ssq?.push?.('setLoginInfo', {
      custom_fields_ext: {
        lang: localStorage.getItem('lang') || 'en-US',
        originLang: navigator.language,
        ...customAttr,
      },
    })
  }
  win.ssq?.push?.('chatOpen')
}

interface TopBarWrapperProps {
  title?: React.ReactNode
  rightNode?: React.ReactNode
  leftNode?: React.ReactNode
  rightNodeType?: 'wallet' | 'service' | 'both' | null
  leftNodeType?: 'service' | null
  csClassName?: string
  titleAlignLeft?: boolean
  isBonus?: boolean
  hideBack?: boolean
  onBack?: () => void
  className?: string
  color?: string
  background?: string
  boxShadow?: string
  leftIconClassName?: string
}

const TopBarWrapperInner = ({
  rightNode,
  leftNode,
  rightNodeType = 'wallet',
  leftNodeType = null,
  csClassName,
  titleAlignLeft,
  isBonus,
  ...rest
}: TopBarWrapperProps) => {
  const [showWallet, showService] = useMemo(() => {
    if (!rightNodeType) return [false, false]
    if (rightNodeType === 'both') return [true, true]
    return [rightNodeType === 'wallet', rightNodeType === 'service']
  }, [rightNodeType])

  return (
    <TopBar
      titleAlignLeft={titleAlignLeft}
      {...rest}
      leftNode={
        <div className="h-full flex items-center">
          {leftNode}
          {!leftNode && leftNodeType === 'service' && (
            <div onClick={() => openCS()}>
              <HeadsetIcon />
            </div>
          )}
        </div>
      }
      rightNode={
        <div className="h-full flex items-center">
          {rightNode}
          {showWallet && <BalanceDisplay isBonus={isBonus} />}
          {rightNodeType === 'both' && titleAlignLeft && <div className="w-6" />}
          {showService && (
            <div
              onClick={() => openCS()}
              className={'relative ' + (rightNodeType === 'both' ? 'ml-1' : '')}
            >
              <HeadsetIcon className={csClassName} />
              <CsPingDot wapperClassName="absolute! -top-0.5 -right-0.5" />
            </div>
          )}
        </div>
      }
    />
  )
}

export const TopBarWrapper = memo(TopBarWrapperInner)
