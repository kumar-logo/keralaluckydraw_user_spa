import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { OrderItemWrapper } from '../shared/OrderItemWrapper'
import { DataTable } from '../shared/DataTable'
import { DiceSingle, DiceNum, DiceSumBadge } from './DiceVisuals'
import { renderBetIcon } from './diceBetOptions'
import { OrderHeaderCard } from '../order_detail/OrderHeaderCard'
import { TimedResultCell, DiceExpandRows } from '../order_detail/ResultCells'
import {
  OrderRecord,
  DiceBet,
  DATE_DAY_MONTH_YEAR_TIME,
  computeTicketStatus,
} from '../order_detail/orderDetailTypes'
import { formatCurrency } from '../../utils/format'
import { formatDate } from '../../utils/date'

const DicePlaceholder = ({ isTriple, rounded }: { isTriple?: boolean; rounded?: boolean }) => (
  <div
    className={`size-6 text-main text-xl flex justify-center items-center bg-white font-bold ${
      rounded ? 'rounded-full text-sm!' : 'bg-light-gray!'
    }`}
  >
    {isTriple ? '-' : '?'}
  </div>
)

export const DiceBetDetail = ({ order }: { order: OrderRecord }) => {
  const { t } = useTranslation()
  const typeList = order.typeList ?? []
  const isTriple = useMemo(
    () => (order.result ? new Set(order.result.split(',')).size === 1 : false),
    [order.result]
  )
  const status = useMemo(() => computeTicketStatus(typeList), [typeList])

  return (
    <div className="w-full h-full flex flex-col overflow-hidden color">
      <OrderHeaderCard
        orderNo={order.orderGroup}
        status={status}
        gameName={`K3-${order.tabMin || 0}Minute`}
        cover={order.icon}
        winAmount={order.totalPrize ?? 0}
        code={order.roundNo as string}
        betTime={order.createTime ? formatDate(order.createTime, DATE_DAY_MONTH_YEAR_TIME) : ''}
        totalPayment={order.totalAmount}
        drawTime={order.drawSec ? formatDate(order.drawSec, DATE_DAY_MONTH_YEAR_TIME) : ''}
      />
      <div className="flex flex-col flex-1 gap-y-3 p-2 overflow-y-auto">
        <OrderItemWrapper
          item={{
            ...order,
            totalAmount: undefined,
            gameName: `K3-${order.tabMin || 0}Minute`,
            drawTime: order.drawSec,
          }}
          resultRender={
            <div className="flex items-center justify-end *:ml-1">
              {order.result
                ? order.result.split(',').map((value, index) => <DiceSingle key={index} size={24} num={Number(value)} />)
                : Array(3).fill(0).map((_, index) => <DicePlaceholder key={index} />)}
              {order.resultCount && !isTriple ? (
                <DiceNum num={order.resultCount} size={24} />
              ) : (
                <DicePlaceholder rounded isTriple={isTriple} />
              )}
              {!order.result || !order.resultCount || isTriple ? (
                <>
                  <DicePlaceholder isTriple={isTriple} rounded />
                  <DicePlaceholder isTriple={isTriple} rounded />
                </>
              ) : (
                <>
                  <DiceSumBadge size={24} type={order.resultCount > 10 ? 'big' : 'small'} />
                  <DiceSumBadge size={24} type={order.resultCount % 2 ? 'odd' : 'even'} />
                </>
              )}
            </div>
          }
        >
          <p className="text-sm text-main font-bold mb-2">{t('common.label.games.myBets')}</p>
          <DataTable
            result={typeList}
            cols={[
              {
                title: t('common.label.table.number'),
                render: (bet: DiceBet) => renderBetIcon(bet.betItem),
              },
              {
                title: t('common.label.games.payment'),
                render: (bet: DiceBet) => (
                  <div className="text-sec text-sm font-bold din">{formatCurrency(bet.amount)}</div>
                ),
              },
              {
                title: t('common.label.result'),
                render: (bet: DiceBet) => <TimedResultCell status={bet.status} prize={bet.prize} />,
              },
            ]}
            expandRender={(bet: DiceBet, index: number) => (
              <DiceExpandRows
                index={index}
                delivery={bet.basePrice}
                fee={bet.amount - bet.basePrice}
                createTime={bet.createTime}
              />
            )}
          />
        </OrderItemWrapper>
      </div>
    </div>
  )
}
