import { useMemo, useCallback, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { OrderItemWrapper } from '../shared/OrderItemWrapper'
import { DataTable } from '../shared/DataTable'
import { ColorBall } from '../four_five_digit/ColorBall'
import { DigitBallRow } from '../shared/DigitBallRow'
import { PositionConfigProvider } from '../../config/positionConfig'
import { useDigitPositionConfigStore } from '../../stores/digitPositionConfigStore'
import { OrderHeaderCard } from '../order_detail/OrderHeaderCard'
import { DigitResultCell } from '../order_detail/ResultCells'
import {
  OrderRecord,
  DigitCodeEntry,
  STATUS_TO_BE_DRAWN,
  STATUS_WON,
  STATUS_NO_WIN,
  DATE_DAY_MONTH_TIME,
  DATE_DAY_MONTH_YEAR_TIME,
} from '../order_detail/orderDetailTypes'
import { formatCurrency } from '../../utils/format'
import { formatDate } from '../../utils/date'

export const ThreeDigitBetDetail = ({ order }: { order: OrderRecord }) => {
  const { t } = useTranslation()
  const codeLists = order.codeLists ?? []
  const positionEntry = useDigitPositionConfigStore((s) => s.getByGameId(order.gameId))

  const drawn = !!order.wonCode && !order.wonCode.startsWith('*')
  const status = useMemo(() => {
    if (!order.wonCode || order.wonCode === '***') return STATUS_TO_BE_DRAWN
    return (order.winAmount ?? 0) > 0 ? STATUS_WON : STATUS_NO_WIN
  }, [order.wonCode, order.winAmount])

  const resultDigits = useMemo(
    () =>
      order.wonCode
        ? order.wonCode.split('')
        : new Array(positionEntry.labels.length || 3).fill('*'),
    [order.wonCode, positionEntry.labels.length]
  )

  const renderIndexCode = useCallback((indexCode: string): ReactNode => {
    const [positions, digits] = (indexCode || '').split('=')
    return <DigitBallRow digits={digits ?? ''} positions={positions ?? ''} />
  }, [])

  return (
    <PositionConfigProvider colors={positionEntry.colors} labels={positionEntry.labels}>
      <OrderHeaderCard
        orderNo={order.orderGroup}
        status={status}
        gameName={order.gameName ?? ''}
        winAmount={order.winAmount ?? 0}
        code={order.orderGroup}
        cover={order.gameIcon || order.gameIconUrl}
        betTime={order.createTime ? formatDate(order.createTime, DATE_DAY_MONTH_YEAR_TIME) : ''}
        totalPayment={order.totalAmount}
        drawTime={order.drawTime ? formatDate(order.drawTime, DATE_DAY_MONTH_TIME) : ''}
      />
      <div className="flex flex-col flex-1 p-2 overflow-y-auto">
        <OrderItemWrapper
          item={{
            ...order,
            totalAmount: undefined,
          }}
          resultRender={
            <div className="flex *:ml-1">
              {resultDigits.map((digit, index) => (
                <ColorBall
                  key={index}
                  index={index}
                  digit={digit}
                  ballSize="2rem"
                  fontSize="1rem"
                  borderSize="0.25rem"
                />
              ))}
            </div>
          }
        >
          <p className="text-sm text-main font-bold mb-2">{t('common.label.games.myBets')}</p>
          <DataTable
            result={codeLists}
            cols={[
              {
                title: t('common.label.table.number'),
                render: (entry: DigitCodeEntry) => (
                  <div className="text-left">{renderIndexCode(entry.indexCode ?? '')}</div>
                ),
              },
              {
                title: t('common.label.games.payment'),
                render: (entry: DigitCodeEntry) => (
                  <div className="flex-1 text-center din text-sm font-bold text-sec">
                    {formatCurrency(entry.pickAmount ?? 0)}*{entry.pickCount}
                  </div>
                ),
              },
              {
                title: t('common.label.result'),
                render: (entry: DigitCodeEntry) => (
                  <DigitResultCell drawn={drawn} prize={entry.codeWinAmount || entry.winAmount || entry.prize || 0} />
                ),
              },
            ]}
          />
        </OrderItemWrapper>
      </div>
    </PositionConfigProvider>
  )
}
