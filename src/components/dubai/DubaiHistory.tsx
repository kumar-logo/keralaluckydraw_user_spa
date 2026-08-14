import { useTranslation } from 'react-i18next'
import { getDubaiDrawHistory, getDubaiOrderList, DubaiOrderRecord, DubaiDrawRow } from '../../services/dubaiApi'
import { CodeEntry } from '../order_detail/orderDetailTypes'
import { formatCurrency } from '../../utils/format'
import { formatDate } from '../../utils/date'
import { PaginatedList } from '../shared/PaginatedList'
import { OrderItemWrapper } from '../shared/OrderItemWrapper'
import { DataTable } from '../shared/DataTable'
import { DUBAI_ICONS, DubaiNumberIcon } from './DubaiIcons'

interface OrderResultIconProps {
  result?: string | number
}

const OrderResultIcon = ({ result }: OrderResultIconProps) => {
  const num = parseInt(String(result ?? ''), 10)
  const IconComponent = DUBAI_ICONS[num]

  if (!result || !num || !IconComponent) {
    return (
      <div className="size-4.5 rounded-full border border-text-main text-main flex justify-center items-center">
        ?
      </div>
    )
  }

  return <DubaiNumberIcon number={num} className="size-4.5 text-(--dubai-theme-color)" />
}

interface OrderCardProps {
  item: DubaiOrderRecord
}

const OrderCard = ({ item }: OrderCardProps) => {
  const { t } = useTranslation()

  const codeList: CodeEntry[] = Array.isArray(item.codeList) ? item.codeList : []
  const aggregated = {
    ...item,
    codeList,
    status: codeList.some((c) => c.status === 1)
      ? 1
      : codeList.some((c) => c.status === 0)
        ? 0
        : 2,
    totalAmount: codeList.reduce((sum, c) => sum + c.amount, 0),
  }

  return (
    <OrderItemWrapper
      key={item.orderGroup}
      item={aggregated}
      className="mt-2 first:mt-0"
      resultRender={<OrderResultIcon result={item.result} />}
    >
      <DataTable
        result={codeList}
        cols={[
          {
            title: t('common.label.table.number'),
            render: (row: CodeEntry) => (
              <div className="flex items-center">
                {row.betNum != null && DUBAI_ICONS[row.betNum] ? (
                  <DubaiNumberIcon number={row.betNum} className="size-7 mr-2 text-(--dubai-theme-color)" />
                ) : (
                  <div className="size-7 mr-2 rounded-full border border-text-main text-main flex justify-center items-center">?</div>
                )}
                <span className="font-bold text-main">{row.betNum}</span>
              </div>
            ),
          },
          {
            title: t('common.label.games.payment'),
            render: (row: CodeEntry) => (
              <p className="text-xs text-main font-bold">{formatCurrency(row.amount)}</p>
            ),
          },
          {
            title: t('common.label.result'),
            render: (row: CodeEntry) => (
              <div className="flex flex-col items-end text-xs">
                <p>{t('common.label.won')}</p>
                <p
                  className={
                    aggregated.status && row.prize > 0
                      ? 'text-bg-sec font-bold'
                      : 'text-main'
                  }
                >
                  {aggregated.status === 0 ? '...' : formatCurrency(row.prize)}
                </p>
              </div>
            ),
          },
        ]}
      />
    </OrderItemWrapper>
  )
}

interface DubaiOrderProps {
  gameID: string | number
  updateCode: number
}

export const DubaiOrder = ({ gameID, updateCode }: DubaiOrderProps) => (
  <PaginatedList<DubaiOrderRecord>
    updateCode={updateCode}
    pageSize={3}
    getResult={(page, pageSize) =>
      getDubaiOrderList({
        pageNo: page,
        pageSize,
        gameID,
        orderStatus: 3,
      })
    }
    contentRender={(items) => (
      <div className="m-2 rounded-sm">
        {items.map((item) => (
          <OrderCard key={item.orderGroup} item={item} />
        ))}
      </div>
    )}
  />
)

interface DubaiHistoryProps {
  gameID: string | number
  gameType?: number
  updateCode: number
  className?: string
  dropClassName?: string
}

export const DubaiHistory = ({
  gameID,
  gameType,
  updateCode,
  className,
  dropClassName = 'z-60!',
}: DubaiHistoryProps) => {
  const { t } = useTranslation()

  return (
    <PaginatedList<DubaiDrawRow>
      updateCode={updateCode}
      pageSize={gameType ? 20 : 10}
      getResult={(page, pageSize) =>
        getDubaiDrawHistory({
          pageNo: page,
          pageSize,
          gameID,
        })
      }
      dropClassName={dropClassName}
      className={className}
      contentRender={(items) => {

        if (gameType) {
          return (
            <div className="m-2 rounded-sm">
              <div className="flex justify-between items-center bg-table-header p-2 text-xs">
                <p>{t('common.label.table.issue')}</p>
                <p>{t('common.label.table.number')}</p>
              </div>
              {items.map((item) => {
                const IconComp = DUBAI_ICONS[parseInt(item.result)]
                return (
                  <div
                    key={item.roundNo}
                    className="odd:bg-table-odd even:bg-table-even p-2 flex items-center justify-between font-bold text-main"
                  >
                    <p className="text-xs">{item.roundNo}</p>
                    <div className="flex items-center">
                      <span className="mr-2">{item.result}</span>
                      {!!IconComp && (
                        <DubaiNumberIcon number={parseInt(item.result)} className="size-5 text-(--dubai-theme-color)" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }

        const grouped = items.reduce<DubaiDrawRow[][]>((acc, item) => {
          const [dayStr, timeStr] = formatDate(item.drawSec * 1000, 'dddd dd Mon yyyy-hh ').split('-')
          item.drawDayStr = dayStr
          item.drawTimeStr = timeStr
          const existing = acc.find((group) => group[0].drawDayStr === item.drawDayStr)
          if (existing) {
            existing.push(item)
          } else {
            acc.push([item])
          }
          return acc
        }, [])

        return (
          <div className="p-2">
            {grouped.map((group, gIdx) => (
              <div
                key={gIdx}
                className="bg-selected rounded-sm p-2 mt-2 first:mt-0"
              >
                <p className="text-sm font-bold text-main mb-2">
                  {group[0].drawDayStr}
                </p>
                <div className="grid grid-cols-8 gap-x-2 gap-y-1">
                  {group.map((item) => {
                    const IconComp = DUBAI_ICONS[parseInt(item.result)]
                    return (
                      <div
                        key={item.roundNo}
                        className="rounded flex flex-col items-center text-(--dubai-theme-color) dark:bg-(--dubai-theme-color)/20"
                      >
                        <div className="w-full flex flex-col flex-1 items-center rounded bg-transparent py-0.5 border border-(--dubai-theme-color)">
                          {IconComp != null ? (
                            <DubaiNumberIcon number={parseInt(item.result)} className="size-6" />
                          ) : (
                            <div className="size-6" />
                          )}
                          <span className="text-main text-xs h-4 font-bold mt-0.5">
                            {item.result}
                          </span>
                        </div>
                        <span className="text-10 my-0.5">{item.drawTimeStr}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      }}
    />
  )
}
