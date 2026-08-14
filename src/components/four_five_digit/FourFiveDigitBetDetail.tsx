import { useTranslation } from 'react-i18next'
import { ScrollShadow } from '@nextui-org/react'
import { DataTable } from '../shared/DataTable'
import { DigitBallRow } from '../shared/DigitBallRow'
import { PositionConfigProvider } from '../../config/positionConfig'
import { useDigitPositionConfigStore } from '../../stores/digitPositionConfigStore'
import { OrderHeaderCard } from '../order_detail/OrderHeaderCard'
import { WonOnlyResultCell } from '../order_detail/ResultCells'
import {
  OrderRecord,
  DigitCodeEntry,
  STATUS_TO_BE_DRAWN,
  DATE_DAY_MONTH_TIME,
  DATE_DAY_MONTH_YEAR_TIME,
} from '../order_detail/orderDetailTypes'
import { formatCurrency } from '../../utils/format'
import { formatDate } from '../../utils/date'

export const FourFiveDigitBetDetail = ({ order }: { order: OrderRecord }) => {
  const { t } = useTranslation()
  const codeLists = order.codeLists ?? []
  const status = order.status ?? STATUS_TO_BE_DRAWN
  const positionEntry = useDigitPositionConfigStore((s) => s.getByGameId(order.gameId))

  return (
    <PositionConfigProvider colors={positionEntry.colors} labels={positionEntry.labels}>
      <OrderHeaderCard
        orderNo={order.orderGroup}
        status={status}
        gameName={order.gameName ?? ''}
        winAmount={order.totalPrize ?? 0}
        code={order.orderGroup}
        cover={order.icon}
        betTime={order.createTime ? formatDate(order.createTime, DATE_DAY_MONTH_YEAR_TIME) : ''}
        totalPayment={order.totalAmount}
        drawTime={order.drawTime ? formatDate(order.drawTime, DATE_DAY_MONTH_TIME) : ''}
      />
      <ScrollShadow className="flex flex-col flex-1 p-2 overflow-y-auto">
        <DataTable
          result={codeLists}
          cols={[
            {
              title: t('common.label.table.number'),
              render: (entry: DigitCodeEntry) => (
                <DigitBallRow digits={entry.number ?? ''} />
              ),
            },
            {
              title: t('common.label.games.payment'),
              render: (entry: DigitCodeEntry) => (
                <p className="text-xs text-main font-bold">
                  {formatCurrency(entry.pickAmount ?? 0)} * {entry.count}
                </p>
              ),
            },
            {
              title: t('common.label.result'),
              render: (entry: DigitCodeEntry) => <WonOnlyResultCell status={status} prize={entry.prize ?? 0} />,
            },
          ]}
        />
      </ScrollShadow>
    </PositionConfigProvider>
  )
}
