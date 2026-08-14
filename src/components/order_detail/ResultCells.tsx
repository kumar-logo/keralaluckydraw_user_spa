import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/format'
import { formatDate } from '../../utils/date'
import {
  STATUS_TO_BE_DRAWN,
  STATUS_WON,
  PENDING_VALUE,
  DATE_DAY_MONTH_YEAR_TIME_SEC,
  DATE_YEAR_MONTH_DAY_TIME_SEC,
} from './orderDetailTypes'

export const TimedResultCell = ({ status, prize }: { status: number; prize: number }) => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-end">
      <div className="text-xs text-sec">
        {status === STATUS_TO_BE_DRAWN
          ? t('common.label.toBeDrawn')
          : t(status === STATUS_WON ? 'common.label.won' : 'common.label.nowin')}
      </div>
      <div className={`text-sm din font-bold ${status === STATUS_WON && prize > 0 ? 'text-bg-sec' : 'text-main'}`}>
        {status === STATUS_TO_BE_DRAWN ? PENDING_VALUE : formatCurrency(prize)}
      </div>
    </div>
  )
}

export const DigitResultCell = ({ drawn, prize }: { drawn: boolean; prize: number }) => {
  const { t } = useTranslation()
  return (
    <div className="flex-1 flex justify-end flex-center-y">
      <div className="flex flex-col items-end ml-2">
        <span className="text-sec text-xs f-s m-b-xxs">
          {drawn ? t(prize > 0 ? 'common.label.won' : 'common.label.nowin') : t('common.label.toBeDrawn')}
        </span>
        <span className={`din text-sm font-bold ${prize > 0 ? 'text-(--bg-color-second)' : 'text-main'}`}>
          {drawn ? formatCurrency(prize) : PENDING_VALUE}
        </span>
      </div>
    </div>
  )
}

export const KeralaResultCell = ({ status, prize }: { status: number; prize: number }) => {
  const { t } = useTranslation()
  return (
    <div className="flex-1 flex justify-end flex-center-y">
      <div className="flex flex-col items-end ml-2">
        <span className="text-sec text-xs f-s m-b-xxs">
          {status !== STATUS_TO_BE_DRAWN ? t(prize > 0 ? 'common.label.won' : 'common.label.nowin') : t('common.label.toBeDrawn')}
        </span>
        <span className={`din text-sm font-bold ${prize > 0 ? 'text-(--bg-color-second)' : 'text-main'}`}>
          {status !== STATUS_TO_BE_DRAWN ? formatCurrency(prize) : PENDING_VALUE}
        </span>
      </div>
    </div>
  )
}

export const WonOnlyResultCell = ({ status, prize }: { status: number; prize: number }) => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-end text-xs">
      <p>
        {status === STATUS_TO_BE_DRAWN
          ? t('common.label.toBeDrawn')
          : t(prize > 0 ? 'common.label.won' : 'common.label.nowin')}
      </p>
      <p className={status !== STATUS_TO_BE_DRAWN && prize > 0 ? 'text-bg-sec font-bold' : 'text-main'}>
        {status === STATUS_TO_BE_DRAWN ? PENDING_VALUE : formatCurrency(prize)}
      </p>
    </div>
  )
}

export interface ExpandRowsProps {
  index: number
  delivery: number
  fee: number
  createTime?: number
}

export const ExpandRows = ({ index, delivery, fee, createTime }: ExpandRowsProps) => {
  const { t } = useTranslation()
  return (
    <div
      className={`w-full text-xs *:flex *:justify-between px-2 pb-4 ${index % 2 ? 'bg-table-odd' : 'bg-table-even'}`}
    >
      <div>
        <p className="text-acc">{t('common.label.games.Delivery')}</p>
        <p className="text-sec">{formatCurrency(delivery)}</p>
      </div>
      <div className="my-2">
        <p className="text-acc">{t('common.label.games.Fee')}</p>
        <p className="text-sec">{formatCurrency(fee)}</p>
      </div>
      <div>
        <p className="text-acc">{t('common.label.games.bettingTime')}</p>
        <p className="text-sec">{createTime ? formatDate(createTime, DATE_DAY_MONTH_YEAR_TIME_SEC) : ''}</p>
      </div>
    </div>
  )
}

export const DiceExpandRows = ({ index, delivery, fee, createTime }: ExpandRowsProps) => {
  const { t } = useTranslation()
  return (
    <div
      className={`w-full text-xs *:flex *:justify-between px-2 pb-4 ${index % 2 ? 'bg-table-odd' : 'bg-table-even'}`}
    >
      <div className="mt-2 py-2 flex justify-between text-xs">
        <p className="text-acc">{t('common.label.games.Delivery')}</p>
        <p className="text-sec">{formatCurrency(delivery)}</p>
      </div>
      <div className="my-3 py-2 flex justify-between text-xs">
        <p className="text-acc">{t('common.label.games.Fee')}</p>
        <p className="text-sec">{formatCurrency(fee)}</p>
      </div>
      <div className="py-2 flex justify-between text-xs">
        <p className="text-acc">{t('common.label.games.bettingTime')}</p>
        <p className="text-sec">{createTime ? formatDate(createTime, DATE_YEAR_MONTH_DAY_TIME_SEC) : ''}</p>
      </div>
    </div>
  )
}
