import { useTranslation } from 'react-i18next'
import { Button } from '@nextui-org/react'
import { CopyIcon } from './CopyIcon'
import { formatCurrency } from '../../utils/format'
import { formatDate } from '../../utils/date'
import { copyToClipboard } from '../../utils/clipboard'

const STATUS_LABELS = ['common.label.toBeDrawn', 'common.label.won', 'common.label.nowin']
const STATUS_CLASSES = ['bg-linear-tbd text-order-waiting', 'bg-linear-won text-order-finish', 'bg-linear-lose text-sec']

interface OrderItemWrapperProps {
  item?: any
  children?: React.ReactNode
  className?: string
  resultRender?: React.ReactNode
  hideWinOrNot?: boolean

  Header?: React.ReactNode
}

export const OrderItemWrapper = ({ item, children, className, resultRender, hideWinOrNot, Header }: OrderItemWrapperProps) => {
  const { t } = useTranslation()

  if (Header) {
    return (
      <div className={className}>
        <div className="bg-[#D6E0E8] dark:bg-gray p-3 rounded-b-xl border-dashed border-b border-sec-acc">
          {Header}
        </div>
        <div className="rounded-t-xl bg-white dark:bg-gray pt-3">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="bg-[#D6E0E8] dark:bg-gray p-2 rounded-b-xl border-dashed border-b border-acc flex items-center justify-between">
        <div className="leading-4">
          <p className="font-bold text-main text-sm">{item.gameName}</p>
          <p className="text-xs">{item.roundNo ?? item.orderGroup}</p>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-xs mb-1">
            <span className="mr-2 text-acc">{t('common.label.games.drawTime')}</span>
            {formatDate(item.drawTime, 'dd-MM-yyyy hh:mm')}
          </p>
          {resultRender}
        </div>
      </div>
      <div className="rounded-t-xl bg-white dark:bg-gray">
        {typeof item.status === 'number' && (
          <div className="p-2 border-b border-gray dark:border-sec/40">
            <div className={`flex justify-between items-center rounded-l-sm text-xs p-2 ${STATUS_CLASSES[item.status]}`}>
              <p className="text uppercase">{t(STATUS_LABELS[item.status])}</p>
              <div className="flex items-center justify-center gap-x-2">
                <p className="text-acc">ID</p>
                <p className="text-sec">{item.orderGroup}</p>
                <Button
                  className="w-3.5 h-3.5 px-0 min-w-0 gap-0 rounded-none"
                  onPress={() => copyToClipboard(item.orderGroup)}
                >
                  <CopyIcon />
                </Button>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col p-2">
          {typeof item.totalAmount === 'number' && (
            <div className="flex justify-between">
              <div className="text-xs">
                <p className="text-main text-sm font-bold">{t('common.label.games.myBets')}</p>
                {formatDate(item.createTime, 'dd-MM-yyyy hh:mm:ss')}
              </div>
              <div className="flex flex-col items-end text-xs text-acc">
                {t('common.label.games.totalPayment')}
                <p className="text-sm font-bold text-main">{formatCurrency(item.totalAmount)}</p>
              </div>
            </div>
          )}
          {hideWinOrNot ? null : item.status === 1 ? (
            <div className="rounded bg-charcoal px-3 text-xs text-center py-2 my-2">
              {t('common.tip.info.orderWin')}
              <br />
              {t('common.tip.info.orderWinAmount')}
              <span className="text-base font-bold text-bg-sec">
                {formatCurrency(item.totalPrize ?? item.winAmount)}
              </span>
            </div>
          ) : item.status === 2 ? (
            <div className="rounded bg-charcoal px-3 text-xs text-center py-2 my-2">
              {t('common.tip.info.orderNoWin')}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  )
}
