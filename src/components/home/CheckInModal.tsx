import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Modal,
  ModalContent,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@nextui-org/react'
import clsx from 'clsx'
import { Spin } from '../shared/Spin'
import { getCheckinInfo, claimActivityAward } from '../../services/hallApi'
import { toast } from '../../utils/toast'
import { fetchAndSyncBalance } from '../../utils/fetchBalance'
import { EarnMoneySpriteIcon } from '../shared/SpriteIcon'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'

interface CheckInDay {
  actKey: string
  awardNum: number
  awardType: string
  dayNum: number
  status: number
  timeKey: string
}

const defaultDayList: CheckInDay[] = [
  { actKey: '', awardNum: 1, awardType: 'chip', dayNum: 1, status: 0, timeKey: '' },
  { actKey: '', awardNum: 1, awardType: 'chip', dayNum: 2, status: 0, timeKey: '' },
  { actKey: '', awardNum: 1, awardType: 'chip', dayNum: 3, status: 0, timeKey: '' },
  { actKey: '', awardNum: 1, awardType: 'chip', dayNum: 4, status: 0, timeKey: '' },
  { actKey: '', awardNum: 1, awardType: 'chip', dayNum: 5, status: 0, timeKey: '' },
  { actKey: '', awardNum: 1, awardType: 'chip', dayNum: 6, status: 0, timeKey: '' },
  { actKey: '', awardNum: 1, awardType: 'chip', dayNum: 7, status: 0, timeKey: '' },
]

const RuleIcon = ({ className }: { className?: string }) => (
  <svg
    className={clsx('size-5', className)}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_20110_26478)">
      <path
        d="M11.998 22C14.7594 22 17.2594 20.8807 19.0691 19.0711C20.8787 17.2614 21.998 14.7614 21.998 12C21.998 9.2386 20.8787 6.7386 19.0691 4.92893C17.2594 3.11929 14.7594 2 11.998 2C9.23665 2 6.73665 3.11929 4.92698 4.92893C3.11734 6.7386 1.99805 9.2386 1.99805 12C1.99805 14.7614 3.11734 17.2614 4.92698 19.0711C6.73665 20.8807 9.23665 22 11.998 22Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M12 14.3125V12.3125C13.6568 12.3125 15 10.9693 15 9.3125C15 7.65565 13.6568 6.3125 12 6.3125C10.3432 6.3125 9 7.65565 9 9.3125"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 18.8125C12.6904 18.8125 13.25 18.2529 13.25 17.5625C13.25 16.8722 12.6904 16.3125 12 16.3125C11.3097 16.3125 10.75 16.8722 10.75 17.5625C10.75 18.2529 11.3097 18.8125 12 18.8125Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_20110_26478">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
)

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="size-8"
    viewBox="0 0 32 32"
    fill="none"
  >
    <path
      d="M28.8537 9.28934C30.5285 12.4973 30.9432 16.2157 30.0163 19.7138C29.0894 23.212 26.8879 26.2371 23.8444 28.1949C20.8008 30.1527 17.1351 30.9016 13.5675 30.2945C9.9999 29.6874 6.78826 27.7682 4.56355 24.9139C2.33883 22.0596 1.26186 18.4766 1.5442 14.8687C1.82654 11.2609 3.44779 7.88899 6.08944 5.41554C8.7311 2.94208 12.2022 1.54583 15.8208 1.50111C19.4394 1.45638 22.944 2.76641 25.6459 5.17383"
      stroke="white"
      strokeWidth={3}
      strokeLinecap="round"
    />
    <rect
      x={12.292}
      y={21.8926}
      width={3}
      height={13.3333}
      rx={1.5}
      transform="rotate(-135 12.292 21.8926)"
      fill="white"
    />
    <rect
      x={21.4844}
      y={19.7712}
      width={3}
      height={13.3333}
      rx={1.5}
      transform="rotate(135 21.4844 19.7712)"
      fill="white"
    />
  </svg>
)

const CheckInGrid = ({
  dayList,
  onAward,
}: {
  dayList: CheckInDay[]
  onAward: (day: CheckInDay) => Promise<void>
}) => {
  const { t } = useTranslation()
  const isDarkMode = useUIStore((s) => s.isDarkMode)

  return (
    <div
      style={{
        backgroundImage: isDarkMode
          ? 'url(/images/activities/daily-check-in-bg-dark.webp)'
          : 'url(/images/activities/daily-check-in-bg-light.webp)',
        backgroundSize: '100% 100%',
      }}
      className="px-5 pb-2.5 pt-26.5 bg-cover bg-no-repeat relative"
    >

      <Popover placement="bottom-start" showArrow>
        <PopoverTrigger>
          <div className="flex items-center text-xs absolute left-11 top-7 cursor-pointer">
            <RuleIcon className="size-3! mr-0.5" />
            {t('common.label.games.rule')}
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-3 w-80 rounded-lg -ml-5">
          <ul className="capitalize text-xs leading-3.5 list-disc ml-3">
            <li>{t('referral.tip.rules.checkinRule1')}</li>
            <li className="my-3">{t('referral.tip.rules.checkinRule2')}</li>
            <li>{t('referral.tip.rules.checkinRule3')}</li>
            <li className="mt-3">{t('referral.tip.rules.checkinRule4')}</li>
          </ul>
        </PopoverContent>
      </Popover>

      <div className="grid grid-cols-4 gap-2 p-2 bg-gray rounded-xl">
        {dayList.map((day, idx) => {
          const isClaimable = day.status === 2

          return (
            <Button
              key={idx}
              className={clsx(
                'py-2 px-3 rounded-lg h-auto w-auto gap-0 bg-linear-to-b from-[#F5F7F9] dark:from-[#6C6C6C] to-[#E8ECEF] dark:to-[#464A47] flex flex-col items-center',
                day.status === 3 && 'opacity-50',
                isClaimable && 'bg-linear-primary-tb shadow-btn-primary text-gray!'
              )}
              onPress={() => {
                if (isClaimable) {
                  onAward(day).then(() => toast.success(t('common.tip.success.claim')))
                } else if (day.status === 3) {
                  toast.warning(t('referral.tip.activity.alreadyClaimed'))
                } else {
                  toast.warning(t('referral.tip.activity.notAchieved'))
                }
              }}
            >
              <p className={clsx('font-bold text-xs capitalize text-main', isClaimable && 'dark:text-gray')}>
                {t('common.label.day')} {idx + 1}
              </p>
              <EarnMoneySpriteIcon pos="goldCoin" className="size-6" scale={1.5} />
              <p className={clsx('din font-bold text-base text-main', isClaimable && 'dark:text-gray')}>
                {day.awardNum}
              </p>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export const CheckInCardWrapper = ({
  children,
  onClick,
  ...rest
}: {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  [key: string]: any
}) => {
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [dayList, setDayList] = useState<CheckInDay[]>(defaultDayList)
  const actIdRef = useRef(0)

  const token = useAuthStore((s) => s.token)

  const loadCheckinInfo = () => {
    setLoading(true)
    getCheckinInfo()
      .then((data: any) => {
        actIdRef.current = data.actID
        setDayList(data.dayList)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (token) loadCheckinInfo()
    else setLoading(false)
  }, [])

  useEffect(() => {
    if (isOpen && token) loadCheckinInfo()
  }, [isOpen])

  const handleClaim = (day: CheckInDay) => {
    setLoading(true)
    return claimActivityAward(actIdRef.current, day.actKey, day.timeKey)
      .then(() => {
        setDayList((prev) =>
          prev.map((d) => (d.actKey === day.actKey ? { ...d, status: 3 } : d))
        )
        fetchAndSyncBalance()
        loadCheckinInfo()
      })
      .finally(() => setLoading(false))
  }

  const openModal = () => {

    const hasToken = useAuthStore.getState().token || localStorage.getItem('token')
    if (!hasToken) {
      window.dispatchEvent(new CustomEvent('openLoginModal'))
      return
    }
    setIsOpen(true)
  }

  return (
    <>
      <div
        {...rest}
        onClick={(e) => {
          openModal()
          onClick?.(e)
        }}
      >
        {children}
      </div>

      <Modal
        backdrop="blur"
        placement="center"
        scrollBehavior="inside"
        classNames={{
          backdrop: 'z-55',
          wrapper: 'z-60',
        }}
        isOpen={isOpen}
        onOpenChange={(v) => { if (!v) setIsOpen(false) }}
        hideCloseButton
      >
        <ModalContent className="rounded-none bg-transparent shadow-none flex flex-col items-center">
          <Spin loading={loading} className="mb-4">
            <div className="-mb-3">
              <CheckInGrid dayList={dayList} onAward={handleClaim} />
            </div>
          </Spin>
          <div onClick={() => setIsOpen(false)} className="cursor-pointer">
            <CloseIcon />
          </div>
        </ModalContent>
      </Modal>
    </>
  )
}
