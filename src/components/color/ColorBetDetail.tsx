import { useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { OrderItemWrapper } from '../shared/OrderItemWrapper'
import { DataTable } from '../shared/DataTable'
import { OutlineBall, FullBall } from '../shared/WingoBall'
import { OrderHeaderCard } from '../order_detail/OrderHeaderCard'
import { TimedResultCell, ExpandRows } from '../order_detail/ResultCells'
import {
  OrderRecord,
  ColorTicket,
  STATUS_TO_BE_DRAWN,
  DATE_DAY_MONTH_YEAR_TIME,
  computeTicketStatus,
} from '../order_detail/orderDetailTypes'
import { formatCurrency } from '../../utils/format'
import { formatDate } from '../../utils/date'
import { classifyColorBet, colorBetName, ColorBetKind } from '../../utils/colorBet'

export const ColorBetDetail = ({ order }: { order: OrderRecord }) => {
  const { t } = useTranslation()
  const tickets = order.tickets ?? []
  const status = useMemo(() => computeTicketStatus(tickets), [tickets])

  const renderBall = useCallback((betItem: string, size: number) => {
    return classifyColorBet(betItem) === ColorBetKind.Number ? (
      <OutlineBall size={size} content={Number(betItem)} fontSize={size === 32 ? 16 : undefined} />
    ) : (
      <FullBall size={size} content={colorBetName(betItem)} />
    )
  }, [])

  return (
    <div className="w-full h-full flex flex-col overflow-hidden color">
      <OrderHeaderCard
        orderNo={order.orderGroup}
        status={status}
        gameName={`Wingo-${order.tabMin || 0}Minute`}
        cover={order.icon}
        winAmount={order.totalPrize ?? 0}
        code={order.roundNo as string}
        betTime={order.createTime ? formatDate(order.createTime, DATE_DAY_MONTH_YEAR_TIME) : ''}
        totalPayment={order.totalAmount}
        drawTime={order.drawSec ? formatDate(order.drawSec, DATE_DAY_MONTH_YEAR_TIME) : ''}
      />
      <div className="flex flex-col flex-1 p-2 overflow-y-auto">
        <OrderItemWrapper
          item={{
            ...order,
            totalAmount: undefined,
            gameName: `Wingo-${order.tabMin || 0}Minute`,
            drawTime: order.drawSec,
          }}
          resultRender={
            <div>
              {status !== STATUS_TO_BE_DRAWN ? (
                renderBall(String(order.wonCode), 32)
              ) : (
                <div className="size-8 bg-light-gray rounded-full flex items-center justify-center">?</div>
              )}
            </div>
          }
        >
          <p className="text-sm text-main font-bold mb-2">{t('common.label.games.myBets')}</p>
          <DataTable
            result={tickets}
            cols={[
              {
                title: t('common.label.table.number'),
                render: (ticket: ColorTicket) => <div className="flex">{renderBall(ticket.betItem, 28)}</div>,
              },
              {
                title: t('common.label.games.payment'),
                render: (ticket: ColorTicket) => (
                  <div className="text-sec items-center justify-center text-center text-sm font-bold din">
                    {formatCurrency(ticket.amount)}
                  </div>
                ),
              },
              {
                title: t('common.label.result'),
                render: (ticket: ColorTicket) => <TimedResultCell status={ticket.status} prize={ticket.prize} />,
              },
            ]}
            expandRender={(ticket: ColorTicket, index: number) => (
              <ExpandRows
                index={index}
                delivery={ticket.amount - ticket.fee}
                fee={ticket.fee}
                createTime={ticket.createTime}
              />
            )}
          />
        </OrderItemWrapper>
      </div>
    </div>
  )
}
