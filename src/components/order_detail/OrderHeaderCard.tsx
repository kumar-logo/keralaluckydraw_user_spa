import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Image } from '@nextui-org/react'
import { OrderStatusBadge } from '../shared/OrderStatusBadge'
import { openCS } from '../shared/salesSmartly'
import { formatCurrency } from '../../utils/format'
import { STATUS_TO_BE_DRAWN, STATUS_WON } from './orderDetailTypes'

interface WinBannerProps {
  status: number
  winAmount: number
}

const WinBanner = ({ status, winAmount }: WinBannerProps) => {
  const { t } = useTranslation()
  if (status === STATUS_TO_BE_DRAWN) return null
  const won = status === STATUS_WON
  return (
    <div
      className={`mt-2 text-center rounded bg-light-gray dark:bg-charcoal ${
        won ? 'px-2 py-1 text-xs text-sec' : 'text-sm p-2'
      }`}
    >
      {won ? (
        <>
          <p>{t('common.tip.info.orderWin')}</p>
          <p>
            {t('common.tip.info.orderWinAmount')}{' '}
            <span className="din text-base font-bold text-bg-sec">{formatCurrency(winAmount)}</span>
          </p>
        </>
      ) : (
        <p>{t('common.tip.info.orderNoWin')}</p>
      )}
    </div>
  )
}

const CustomerServiceTip = ({ orderNo }: { orderNo?: string }) => {
  const { t } = useTranslation()
  return (
    <div className="flex justify-center">
      <div
        className="flex text-xs text-acc underline duration-200 active:text-primary"
        onClick={() => openCS({ orderNo })}
      >
        <svg
          className="size-4 mr-2"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20.7225 10.5819C20.6641 5.81223 16.784 1.96265 12 1.96265C7.21607 1.96265 3.33597 5.81223 3.2774 10.5819C2.4767 11.222 1.96265 12.2049 1.96265 13.3093C1.96265 15.2371 3.52586 16.8007 5.4539 16.8007C6.29528 16.8007 7.06682 16.5025 7.66954 16.0072L6.02469 9.8684C5.83839 9.83807 5.64864 9.81789 5.45392 9.81789C5.32562 9.81789 5.19951 9.82583 5.07463 9.83959C5.49543 6.38608 8.43247 3.70832 12.0001 3.70832C15.5673 3.70832 18.5048 6.38605 18.9255 9.83959C18.8011 9.82593 18.6746 9.81789 18.5462 9.81789C18.3516 9.81789 18.1614 9.83811 17.975 9.8684L16.3306 16.0044C16.7958 16.3863 17.3614 16.6503 17.982 16.7513C17.1584 17.6361 16.1111 18.3101 14.9263 18.6747L14.7818 18.819C14.4122 18.1396 13.7008 17.6731 12.873 17.6731C11.6677 17.6731 10.6909 18.6498 10.6909 19.8556C10.6909 21.061 11.6676 22.0377 12.873 22.0377C13.8623 22.0377 14.6875 21.3751 14.9555 20.473C17.3637 19.8827 19.3811 18.2974 20.54 16.1727C21.4445 15.5418 22.0376 14.4955 22.0376 13.3092C22.0375 12.2051 21.523 11.2219 20.7227 10.5818L20.7225 10.5819Z"
            fill="currentColor"
          />
        </svg>
        {t('common.tip.info.contactCsWithOrder')}
      </div>
    </div>
  )
}

export interface OrderHeaderCardProps {
  orderNo?: string
  code?: string
  status: number
  cover?: string
  gameName: string
  drawTime: string
  betTime: string
  totalPayment?: number
  winAmount: number
  tags?: string
  onPress?: () => void
}

export const OrderHeaderCard = ({
  orderNo,
  code,
  status,
  cover,
  gameName,
  drawTime,
  betTime,
  totalPayment,
  winAmount,
  tags,
  onPress,
}: OrderHeaderCardProps) => {
  const { t } = useTranslation()

  const resultNode = useMemo(() => {
    if (status === STATUS_TO_BE_DRAWN) {
      return <p className="text-sec lowercase">{t('common.label.toBeDrawn')}</p>
    }
    return (
      <div className="flex items-center text-sec">
        <p>{t(status === STATUS_WON ? 'common.label.won' : 'common.label.nowin')}</p>
        <p className={`din text-sm font-bold ml-1 ${status === STATUS_WON ? 'text-bg-sec' : 'text-main'}`}>
          {formatCurrency(winAmount)}
        </p>
      </div>
    )
  }, [status, t, winAmount])

  return (
    <div className="p-2 bg-white dark:bg-gray rounded-sm" onClick={onPress}>
      <OrderStatusBadge status={status} code={code} />
      <div className="flex items-center mt-2">
        <div className="flex flex-1 flex-row items-center overflow-hidden">
          <Image src={cover} alt="cover" radius="sm" className="size-12 object-contain" />
          <div className="flex flex-col flex-1 overflow-hidden px-3">
            <p className="flex items-center text-sm font-bold">
              {tags &&
                tags.split(',').map((tag) => (
                  <span
                    key={tag}
                    className="h-4 px-1 bg-[#EA1200] text-10 leading-4 rounded-xs mr-1 text-white uppercase"
                  >
                    {tag}
                  </span>
                ))}
              <span className="flex-1 truncate">{gameName}</span>
            </p>
            <div className="flex text-xs gap-x-2 mt-1">
              <p className="text-acc">{t('common.label.games.drawTime')}</p>
              <p className="text-sec">{drawTime}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-xs text-acc">{t('common.label.games.totalPayment')}</p>
          <p className="text-sm din font-bold mt-1">{formatCurrency(totalPayment ?? 0)}</p>
        </div>
      </div>
      <div className="text-xs border-t border-gray pt-2 mt-2">
        <div className="flex justify-between items-center">
          <p className="text-acc">{t('common.label.games.bettingTime')}</p>
          <p className="text-sec">{betTime}</p>
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-acc">{t('common.label.result')}</p>
          {resultNode}
        </div>
      </div>
      <WinBanner status={status} winAmount={winAmount} />
      <div className="h-3" />
      <CustomerServiceTip orderNo={orderNo} />
    </div>
  )
}
