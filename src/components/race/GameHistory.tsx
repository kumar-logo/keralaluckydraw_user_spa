import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getRaceDrawHistory, getRaceOrderList } from '../../services/raceApi'
import type { RaceDrawHistoryItem, RaceOrderDto, RaceBetEntryDto } from '../../services/raceApi'
import { getRunnerState, stateColors, stateNames, RaceRunner } from '../../config/raceConstants'
import { PlayerBadge, GroupBadge, RankBadge } from './Badges'
import { formatCurrency } from '../../utils/format'
import { PaginatedList } from '../shared/PaginatedList'
import { OrderItemWrapper } from '../shared/OrderItemWrapper'
import { DataTable } from '../shared/DataTable'

export const RaceDrawHistory = ({ gameID, updateCode, className, dropClassName = 'z-60!', single, raceRunners }: {
  gameID: number
  updateCode: number
  className?: string
  dropClassName?: string
  single: boolean
  raceRunners?: RaceRunner[] | null
}) => {
  const { t } = useTranslation()

  return (
    <PaginatedList
      updateCode={updateCode}
      getResult={(page: number, size: number) => getRaceDrawHistory({ pageNo: page, pageSize: size, gameID })}
      dropClassName={dropClassName}
      className={className}
      contentRender={(items: RaceDrawHistoryItem[]) => (
        <div className="rounded-sm my-2 flex-1">
          <div className="flex justify-between items-center bg-table-header p-2 text-xs">
            <p>{t('common.label.table.issue')}</p>
            <p>{t('common.label.result')}</p>
          </div>
          {items.map((draw) => {
            const top3 = (draw.resultTop3 ? draw.resultTop3.split(',') : []).map((num) => parseInt(num, 10))
            return (
              <div
                key={draw.roundNo}
                className="odd:bg-table-odd even:bg-table-even p-2 flex items-center justify-between font-bold text-main"
              >
                <p className="text-xs font-bold">{draw.roundNo}</p>
                <div className="flex items-center justify-end *:not-last:mr-2">
                  {top3.map((runnerNo, rank) => {
                    const state = getRunnerState(runnerNo, single)
                    return (
                      <div key={runnerNo} className="flex items-center">
                        <RankBadge no={rank} />
                        <div className="relative">
                          <PlayerBadge size={20} state={state} raceRunners={raceRunners} />
                          <div
                            className="w-4 text-white text-8 font-bold text-center rounded-sm absolute left-1/2 -ml-2 -bottom-0.5"
                            style={{ backgroundColor: raceRunners?.[state]?.colorHex ?? stateColors[state % stateColors.length] }}
                          >
                            {runnerNo}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {!single && top3.length > 0 && <GroupBadge size={20} state={getRunnerState(top3[0], false)} />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    />
  )
}

export const RaceOrderHistory = ({ gameID, updateCode, raceRunners }: { gameID: number; updateCode: number; raceRunners?: RaceRunner[] | null }) => (
  <PaginatedList
    updateCode={updateCode}
    pageSize={3}
    getResult={(page: number, size: number) => getRaceOrderList({ pageNo: page, pageSize: size, gameID, orderStatus: 3 })}
    contentRender={(items: RaceOrderDto[]) => (
      <div className="my-2 rounded-sm">
        {items.map((order) => (
          <OrderItem key={order.orderGroup} item={order} raceRunners={raceRunners} />
        ))}
      </div>
    )}
  />
)

const OrderItem = ({ item, hideWinOrNot, raceRunners }: { item: RaceOrderDto; hideWinOrNot?: boolean; raceRunners?: RaceRunner[] | null }) => {
  const { t } = useTranslation()
  const isSingle = useMemo(() => item.runnerCount === 6, [item])
  const orderData = useMemo(() => {
    const codeList = Array.isArray(item.codeList) ? item.codeList : []
    const top3 = item.resultTop3 ? item.resultTop3.split(',').map((num) => parseInt(num, 10)) : [-1, -1, -1]
    return {
      ...item,
      codeList,
      status: codeList.some((bet) => bet.status === 1) ? 1 : codeList.some((bet) => bet.status === 0) ? 0 : 2,
      totalAmount: codeList.reduce((sum, bet) => sum + bet.amount, 0),
      top3,
      state: item.resultTop3 ? getRunnerState(top3[0], item.runnerCount === 6) : -1,
    }
  }, [item])

  return (
    <OrderItemWrapper
      item={orderData}
      className="mt-2 first:mt-0"
      hideWinOrNot={hideWinOrNot}
      resultRender={
        <div className="flex items-center justify-end">
          {orderData.top3.map((runnerNo, rank) => (
            <div key={rank} className="flex items-center mr-2">
              <RankBadge size={16} no={rank} />
              {runnerNo > -1 ? (
                <PlayerBadge size={12} state={getRunnerState(runnerNo, isSingle)} raceRunners={raceRunners} />
              ) : (
                <span className="ml-1">?</span>
              )}
              {runnerNo > -1 && <span className="text-10 font-bold text-main ml-1">{runnerNo}</span>}
            </div>
          ))}
          {!isSingle && orderData.state > -1 && <GroupBadge size={16} state={orderData.state} />}
        </div>
      }
    >
      <DataTable
        result={item.codeList}
        cols={[
          {
            title: t('common.label.table.number'),
            render: (bet: RaceBetEntryDto) => {
              if (bet.type === 3) {
                const groupIdx = parseInt(bet.betNum, 10) - 1
                return (
                  <div className="flex items-center">
                    <GroupBadge size={22} state={groupIdx} />
                    <span className="text-sm font-bold text-main ml-2">{raceRunners?.[groupIdx]?.name ?? stateNames[groupIdx % stateNames.length]}</span>
                  </div>
                )
              }
              const runners = bet.betNum.split(',').map((num) => parseInt(num, 10))
              return (
                <div className="flex items-center">
                  {runners.map((runnerNo) => (
                    <div key={runnerNo} className="flex items-center mr-2">
                      <PlayerBadge size={20} state={getRunnerState(runnerNo, isSingle)} raceRunners={raceRunners} />
                      <span className="text-sm font-bold text-main ml-1">{runnerNo}</span>
                    </div>
                  ))}
                </div>
              )
            },
          },
          {
            title: t('common.label.games.payment'),
            render: (bet: RaceBetEntryDto) => <p className="text-xs text-main font-bold">{formatCurrency(bet.amount)}</p>,
          },
          {
            title: t('common.label.result'),
            render: (bet: RaceBetEntryDto) => (
              <div className="flex flex-col items-end text-xs">
                <p>{t('common.label.won')}</p>
                <p className={orderData.status && bet.prize > 0 ? 'text-bg-sec font-bold' : 'text-main'}>
                  {orderData.status === 0 ? '...' : formatCurrency(bet.prize)}
                </p>
              </div>
            ),
          },
        ]}
      />
    </OrderItemWrapper>
  )
}

export { OrderItem }
