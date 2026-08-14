import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { OrderItemWrapper } from '../shared/OrderItemWrapper'
import { DataTable } from '../shared/DataTable'
import { DUBAI_ICONS, DubaiNumberIcon } from './DubaiIcons'
import { OrderHeaderCard } from '../order_detail/OrderHeaderCard'
import { WonOnlyResultCell } from '../order_detail/ResultCells'
import {
  OrderRecord,
  CodeEntry,
  PLACEHOLDER_EMPTY,
  DATE_DAY_MONTH_TIME,
  DATE_DAY_MONTH_YEAR_TIME,
  computeTicketStatus,
  sumAmount,
} from '../order_detail/orderDetailTypes'
import { formatCurrency } from '../../utils/format'
import { formatDate } from '../../utils/date'

const DubaiResultIcon = ({ result }: { result?: string }) => {
  const num = parseInt(result || '', 10)
  if (!result || !num || !DUBAI_ICONS[num]) {
    return (
      <div className="size-8 rounded-full border border-text-main text-main flex justify-center items-center">?</div>
    )
  }
  return <DubaiNumberIcon number={num} className="size-8 text-(--dubai-theme-color)" />
}

export const DubaiBetDetail = ({ order }: { order: OrderRecord }) => {
  const { t } = useTranslation()
  const codeList = order.codeList ?? []
  const status = useMemo(() => computeTicketStatus(codeList), [codeList])
  const totalAmount = useMemo(() => sumAmount(codeList), [codeList])

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
      <div className="flex flex-col flex-1 gap-y-3 p-2 overflow-y-auto">
        <OrderItemWrapper
          item={{
            ...order,
            status,
            totalAmount,
          }}
          resultRender={<DubaiResultIcon result={order.result} />}
        >
          <DataTable
            result={codeList}
            cols={[
              {
                title: t('common.label.table.number'),
                render: (entry: CodeEntry) => (
                  <div className="flex items-center">
                    {entry.betNum != null && DUBAI_ICONS[entry.betNum] ? (
                      <DubaiNumberIcon number={entry.betNum} className="size-7 mr-2 text-(--dubai-theme-color)" />
                    ) : (
                      <div className="size-7 mr-2 rounded-full border border-text-main text-main flex justify-center items-center">
                        ?
                      </div>
                    )}
                    <span className="font-bold text-main">{entry.betNum}</span>
                  </div>
                ),
              },
              {
                title: t('common.label.games.payment'),
                render: (entry: CodeEntry) => (
                  <p className="text-xs text-main font-bold">{formatCurrency(entry.amount)}</p>
                ),
              },
              {
                title: t('common.label.result'),
                render: (entry: CodeEntry) => <WonOnlyResultCell status={status} prize={entry.prize} />,
              },
            ]}
          />
        </OrderItemWrapper>
      </div>
    </div>
  )
}
