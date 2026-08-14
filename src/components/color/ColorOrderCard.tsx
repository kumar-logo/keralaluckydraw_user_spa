import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@nextui-org/react'
import { OutlineBall, FullBall } from '../shared/WingoBall'
import { CopyIcon } from '../shared/CopyIcon'
import { ResultTable } from '../shared/ResultTable'
import { ShowMore } from '../shared/ShowMore'
import { WinLoseStatus } from '../shared/WinLoseStatus'
import { ColorOrderItem } from './ColorOrderItem'
import { classifyColorBet, colorBetName, ColorBetKind } from '../../utils/colorBet'
import { formatCurrency } from '../../utils/format'
import { formatDate } from '../../utils/date'
import { copyToClipboard } from '../../utils/clipboard'
import type { ColorOrderDto } from '../../services/colorApi'

interface ColorOrderCardProps {
  data: ColorOrderDto
}

export const ColorOrderCard = ({ data }: ColorOrderCardProps) => {
  const { t } = useTranslation()
  const [showMore, setShowMore] = useState(false)

  const status = useMemo(() => {
    let sum = 0
    if (data.tickets.every((d) => d.status !== 0)) {
      if (data.tickets.some((d) => d.status === 1)) sum = 1
      else sum = 2
    }
    return {
      0: { className: 'order-tobedrawn', text: t('common.label.toBeDrawn').toLocaleUpperCase() + '...', status: 2 },
      1: { className: 'order-won', text: t('common.label.won').toLocaleUpperCase(), status: 1 },
      2: { className: 'order-nowin', text: t('common.label.nowin').toLocaleUpperCase(), status: 0 },
    }[sum]!
  }, [data.tickets, t])

  return (
    <div className="flex flex-col  mb-3">
      <div className="bg-[#D6E0E8] dark:bg-gray border-b border-dashed border-text-sec-acc rounded-b-xl flex p-3 justify-between">
        <div className="flex flex-col text-sm font-bold text-sec">
          <p className="font-bold text-main">{data.tabMin} {t('common.label.min')}</p>
          <p>{data.roundNo}</p>
          <p>{t('order.label.drawnResult')}</p>
        </div>
        {status.status !== 2 ? (
          classifyColorBet(data.wonCode) === ColorBetKind.Number ? (
            <OutlineBall content={Number(data.wonCode)} size={32} />
          ) : (
            <FullBall content={colorBetName(data.wonCode)} size={32} />
          )
        ) : (
          <div className="size-8 bg-light-gray rounded-full flex items-center justify-center">?</div>
        )}
      </div>
      <div className="rounded-t-xl flex flex-col bg-white dark:bg-gray p-2">
        <div className={`${status.className} p-2 mb-2 flex justify-between items-center rounded-l-xs text-xs`}>
          <p className="text">{status.text}</p>
          <div className="flex items-center justify-center gap-x-2">
            <p className="text-acc">ID</p>
            <p className="text-sec break-words overflow-hidden text-ellipsis">{data.orderGroup}</p>
            <Button
              className="w-3.5 h-3.5 px-0 min-w-0 gap-0 rounded-none"
              onPress={() => copyToClipboard(data.orderNo)}
            >
              <CopyIcon />
            </Button>
          </div>
        </div>
        <div className="border-t border-gray dark:border-selected flex items-center justify-between text-xs text-acc -mx-2 p-2">
          <div className="flex flex-col">
            <span className="text-sm text-main font-bold">{t('common.label.games.myBets')}</span>
            <span className="text-acc">
              {t('common.label.games.bettingTime')}
              <span className="text-sec ml-2">{formatDate(data.createTime, 'dd-MM-yyyy hh:mm:ss')}</span>
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span>{t('common.label.games.totalPayment')}</span>
            <span className="text-sm text-main">{formatCurrency(data.totalAmount)}</span>
          </div>
        </div>
        <WinLoseStatus
          drawn={status.status !== 2}
          win={status.status === 1}
          winAmount={data.totalPrize}
        />
      </div>
      <ResultTable
        dataList={showMore ? data.tickets : data.tickets?.slice(0, 3)}
        className="rounded-none px-2 bg-white dark:bg-gray pb-2"
        th={
          <div className="flex justify-between px-3 flex-1">
            <div className="w-13 text-left">{t('common.label.table.number')}</div>
            <div className="w-18 text-center">{t('common.label.table.time')}</div>
            <div className="w-24 text-center">{t('common.label.games.payment')}</div>
            <div className="w-20 text-right">{t('common.label.result')}</div>
          </div>
        }
        td={(item) => <ColorOrderItem data={item} />}
      />
      {!!data.tickets?.length && data.tickets.length > 3 && (
        <ShowMore showMore={showMore} setShowMore={setShowMore} />
      )}
    </div>
  )
}
