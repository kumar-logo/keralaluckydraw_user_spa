import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { OrderItemWrapper } from '../shared/OrderItemWrapper'
import { DataTable } from '../shared/DataTable'
import { KeralaDigitBall } from './KeralaDigitBall'
import { OrderHeaderCard } from '../order_detail/OrderHeaderCard'
import { KeralaResultCell } from '../order_detail/ResultCells'
import {
  OrderRecord,
  CodeEntry,
  STATUS_TO_BE_DRAWN,
  STATUS_WON,
  STATUS_NO_WIN,
  PLACEHOLDER_EMPTY,
  DATE_DAY_MONTH_TIME,
  DATE_DAY_MONTH_YEAR_TIME,
  sumAmount,
} from '../order_detail/orderDetailTypes'
import { formatCurrency } from '../../utils/format'
import { formatDate } from '../../utils/date'

export const KeralaBetDetail = ({ order }: { order: OrderRecord }) => {
  const { t } = useTranslation()
  const codeList = order.codeList ?? []
  const status = useMemo(() => {
    if (!codeList.length) return STATUS_TO_BE_DRAWN
    if ((order.totalPrize ?? 0) > 0) return STATUS_WON
    return codeList.every((entry) => entry.status === STATUS_TO_BE_DRAWN) ? STATUS_TO_BE_DRAWN : STATUS_NO_WIN
  }, [codeList, order.totalPrize])
  const totalAmount = useMemo(() => sumAmount(codeList), [codeList])

  const placeholder = useMemo(
    () => new Array(((codeList[0]?.code.length || 7) + 1)).join('-'),
    [codeList]
  )
  const resultDigits = (order.result1st || placeholder).split('')

  return (
    <div className="w-full h-full flex flex-col overflow-hidden color">
      <OrderHeaderCard
        orderNo={order.orderGroup}
        status={status}
        gameName={`${order.gameName}-${order.roundNo}`}
        cover={order.icon}
        winAmount={order.totalPrize ?? 0}
        code={order.orderGroup}
        betTime={order.createTime ? formatDate(order.createTime, DATE_DAY_MONTH_YEAR_TIME) : PLACEHOLDER_EMPTY}
        totalPayment={totalAmount}
        drawTime={order.drawTime ? formatDate(order.drawTime, DATE_DAY_MONTH_TIME) : PLACEHOLDER_EMPTY}
      />
      <div className="flex flex-col flex-1 p-2 overflow-y-auto">
        <OrderItemWrapper
          item={order}
          resultRender={
            <div className="flex items-center *:ml-1">
              {resultDigits.map((digit, index) => (
                <KeralaDigitBall key={index} digit={digit} outline={index !== 0} />
              ))}
            </div>
          }
        >
          <p className="text-sm text-main font-bold mb-2">{t('common.label.games.myBets')}</p>
          <DataTable
            result={codeList}
            cols={[
              {
                title: t('common.label.table.number'),
                render: (entry: CodeEntry) => (
                  <div className="w-40 text-left">
                    <div className="flex items-center *:ml-0.5">
                      {entry.code.split('').map((digit, index) => (
                        <KeralaDigitBall key={index} size="1.125rem" digit={digit} outline={index !== 0} />
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                title: t('common.label.games.payment'),
                render: (entry: CodeEntry) => (
                  <div className="w-19 text-center din text-sm font-bold text-sec">{formatCurrency(entry.amount)}</div>
                ),
              },
              {
                title: t('common.label.result'),
                render: (entry: CodeEntry) => <KeralaResultCell status={status} prize={entry.prize} />,
              },
            ]}
          />
        </OrderItemWrapper>
      </div>
    </div>
  )
}
