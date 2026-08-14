import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { OutlineBall, FullBall } from '../shared/WingoBall'
import { formatCurrency } from '../../utils/format'
import { formatDate } from '../../utils/date'
import { ColorBetKind, classifyColorBet, colorBetName, sizeBetName } from '../../utils/colorBet'
import type { ColorOrderTicketDto } from '../../services/colorApi'

const renderBetItem = (code: string, bigText: string, smallText: string) => {
  switch (classifyColorBet(code)) {
    case ColorBetKind.Size:
      return sizeBetName(code) === 'BIG' ? (
        <span className="text-bg-sec font-bold text-sm">{bigText}</span>
      ) : (
        <span className="text-tip font-bold text-sm">{smallText}</span>
      )
    case ColorBetKind.Color:
      return <FullBall size={28} content={colorBetName(code)} />
    case ColorBetKind.Number:
      return <OutlineBall size={28} content={Number(code)} />
    default:
      return <FullBall size={28} content={colorBetName(code)} />
  }
}

interface ColorOrderItemProps {
  data: ColorOrderTicketDto
}

export const ColorOrderItem = ({ data }: ColorOrderItemProps) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const pending = data.status === 0
  const won = data.status === 1 || data.prize > 0
  const statusText = useMemo(
    () => (pending ? t('common.label.toBeDrawn') : won ? t('common.label.won') : t('common.label.nowin')),
    [pending, won, t]
  )

  return (
    <div className="flex flex-col p-2 flex-1" onClick={() => setExpanded((v) => !v)}>
      <div className="flex justify-between items-center">
        <div className="w-13 flex">
          {renderBetItem(String(data.betItem), t('common.label.games.Big'), t('common.label.games.Small'))}
        </div>
        <div className="text-xs text-sec items-center justify-center text-center w-18">
          {formatDate(data.createTime, 'dd/MM/yyyy hh:mm:ss')}
        </div>
        <div className="w-24 text-sec items-center justify-center text-center text-sm font-bold din">
          {formatCurrency(data.amount)}
        </div>
        <div className="w-20 flex justify-end items-center">
          <div className="flex flex-col items-end mr-1">
            <div className="text-xs text-sec">{statusText}</div>
            <div className={`text-sm din font-bold ${!pending && won ? 'text-bg-sec' : 'text-main'}`}>
              {pending ? '...' : formatCurrency(data.prize)}
            </div>
          </div>
          <div
            className="w-3.5 h-3.5"
            style={{ transition: '0.2s', transform: expanded ? '' : 'rotate(-90deg)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3.5 5.25L7 8.75L10.5 5.25"
                stroke="var(--bg-icon-gray)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex flex-col text-xs">
        {expanded && (
          <>
            <div className="mt-2 flex justify-between">
              <p className="text-acc">{t('common.label.games.Delivery')}</p>
              <p className="text-sec">{formatCurrency(data.amount - data.fee)}</p>
            </div>
            <div className="my-3 flex justify-between">
              <p className="text-acc">{t('common.label.games.Fee')}</p>
              <p className="text-sec">{formatCurrency(data.fee)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-acc">{t('common.label.games.bettingTime')}</p>
              <p className="text-sec">{formatDate(data?.createTime, 'dd/MM/yyyy hh:mm:ss')}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
