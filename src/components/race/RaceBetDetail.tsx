import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { OrderItemWrapper } from '../shared/OrderItemWrapper'
import { DataTable } from '../shared/DataTable'
import { PlayerBadge, GroupBadge, RankBadge } from './Badges'
import { getRunnerState, stateNames } from '../../config/raceConstants'
import { OrderHeaderCard } from '../order_detail/OrderHeaderCard'
import { WonOnlyResultCell } from '../order_detail/ResultCells'
import {
  OrderRecord,
  RaceBetEntry,
  RACE_SINGLE_RUNNER_COUNT,
  RACE_BET_TYPE_GROUP,
  PLACEHOLDER_EMPTY,
  DATE_DAY_MONTH_TIME,
  DATE_DAY_MONTH_YEAR_TIME,
  computeTicketStatus,
  sumAmount,
} from '../order_detail/orderDetailTypes'
import { formatCurrency } from '../../utils/format'
import { formatDate } from '../../utils/date'

const RaceBetTable = ({
  codeList,
  status,
  isSingle,
}: {
  codeList: RaceBetEntry[]
  status: number
  isSingle: boolean
}) => {
  const { t } = useTranslation()
  return (
    <DataTable
      result={codeList}
      cols={[
        {
          title: t('common.label.table.number'),
          render: (bet: RaceBetEntry) => {
            if (bet.type === RACE_BET_TYPE_GROUP) {
              const groupIdx = parseInt(bet.betNum, 10) - 1
              return (
                <div className="flex items-center">
                  <GroupBadge size={22} state={groupIdx} />
                  <span className="text-sm font-bold text-main ml-2">
                    {stateNames[groupIdx % stateNames.length]}
                  </span>
                </div>
              )
            }
            const runners = bet.betNum.split(',').map((value) => parseInt(value, 10))
            return (
              <div className="flex items-center">
                {runners.map((runnerNo) => (
                  <div key={runnerNo} className="flex items-center mr-2">
                    <PlayerBadge size={20} state={getRunnerState(runnerNo, isSingle)} />
                    <span className="text-sm font-bold text-main ml-1">{runnerNo}</span>
                  </div>
                ))}
              </div>
            )
          },
        },
        {
          title: t('common.label.games.payment'),
          render: (bet: RaceBetEntry) => <p className="text-xs text-main font-bold">{formatCurrency(bet.amount)}</p>,
        },
        {
          title: t('common.label.result'),
          render: (bet: RaceBetEntry) => <WonOnlyResultCell status={status} prize={bet.prize} />,
        },
      ]}
    />
  )
}

export const RaceBetDetail = ({ order }: { order: OrderRecord }) => {
  const codeList = (order.codeList ?? []) as unknown as RaceBetEntry[]
  const isSingle = order.runnerCount === RACE_SINGLE_RUNNER_COUNT
  const top3 = useMemo(
    () => (order.resultTop3 ? order.resultTop3.split(',').map((value) => parseInt(value, 10)) : [-1, -1, -1]),
    [order.resultTop3]
  )
  const status = useMemo(() => computeTicketStatus(codeList), [codeList])
  const totalAmount = useMemo(() => sumAmount(codeList), [codeList])
  const groupState = order.resultTop3 ? getRunnerState(top3[0], isSingle) : -1

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
          className="mt-2 first:mt-0"
          hideWinOrNot
          item={{
            ...order,
            status,
            totalAmount,
          }}
          resultRender={
            <div className="flex items-center justify-end">
              {top3.map((runnerNo, rank) => (
                <div key={rank} className="flex items-center mr-2">
                  <RankBadge size={16} no={rank} />
                  {runnerNo > -1 ? (
                    <PlayerBadge size={12} state={getRunnerState(runnerNo, isSingle)} />
                  ) : (
                    <span className="ml-1">?</span>
                  )}
                  {runnerNo > -1 && <span className="text-10 font-bold text-main ml-1">{runnerNo}</span>}
                </div>
              ))}
              {groupState > -1 && <GroupBadge size={16} state={groupState} />}
            </div>
          }
        >
          <RaceBetTable codeList={codeList} status={status} isSingle={isSingle} />
        </OrderItemWrapper>
      </div>
    </div>
  )
}
