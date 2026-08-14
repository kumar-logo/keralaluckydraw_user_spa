import { useTranslation } from 'react-i18next'
import {
  getFourFiveDigitDrawHistory,
  getFourFiveDigitOrderList,
  FourFiveDigitDrawRow,
  FourFiveDigitOrderRecord,
} from '../../services/fourFiveDigitApi'
import { DigitCodeEntry } from '../order_detail/orderDetailTypes'
import { formatCurrency } from '../../utils/format'
import { formatDate } from '../../utils/date'
import { PaginatedList } from '../shared/PaginatedList'
import { OrderItemWrapper } from '../shared/OrderItemWrapper'
import { DataTable } from '../shared/DataTable'
import { ColorResult } from './ColorBall'
import { DigitBallRow } from '../shared/DigitBallRow'

const OrderDetail = ({ item }: { item: FourFiveDigitOrderRecord }) => {
  const { t } = useTranslation()

  return (
    <DataTable
      result={item.codeLists}
      cols={[
        {
          title: t('common.label.table.number'),
          render: (a: DigitCodeEntry) => (
            <DigitBallRow digits={a.number ?? ''} />
          ),
        },
        {
          title: t('common.label.games.payment'),
          render: (a: DigitCodeEntry) => (
            <p className="text-xs text-main font-bold">
              {formatCurrency(a.pickAmount ?? 0)} * {a.count}
            </p>
          ),
        },
        {
          title: t('common.label.result'),
          render: (a: DigitCodeEntry) => (
            <div className="flex flex-col items-end text-xs">
              <p>
                {item.status === 0
                  ? t('common.label.toBeDrawn')
                  : (a.prize ?? 0) > 0
                    ? t('common.label.won')
                    : t('common.label.nowin')}
              </p>
              <p
                className={
                  item.status !== 0 && (a.prize ?? 0) > 0 ? 'text-bg-sec font-bold' : 'text-main'
                }
              >
                {item.status === 0 ? '...' : formatCurrency(a.prize ?? 0)}
              </p>
            </div>
          ),
        },
      ]}
    />
  )
}

interface FourFiveDigitHistoryProps {
  updateCode?: number
  gameID: number
}

export const FourFiveDigitHistory = ({
  updateCode = 1,
  gameID,
}: FourFiveDigitHistoryProps) => {
  const { t } = useTranslation()

  return (
    <PaginatedList
      updateCode={updateCode}
      getResult={(n: number, l: number) =>
        getFourFiveDigitDrawHistory({ pageNo: n, pageSize: l, gameID })
      }
      contentWapperClassName="rounded m-2 bg-light-gray"
      headRender={
        <div
          className="grid bg-table-header p-2 text-xs"
          style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
        >
          <p className="col-span-7">{t('common.label.table.issue')}</p>
          <p className="col-span-7 flex justify-center">
            {t('common.label.table.time')}
          </p>
          <p className="col-span-10 text-right">
            {t('common.label.table.number')}
          </p>
        </div>
      }
      contentRender={(rows: FourFiveDigitDrawRow[]) => (
        <div>
          {rows.map((l, r) => (
            <div
              key={r}
              className="odd:bg-table-odd even:bg-table-even px-2 py-3 grid text-main"
              style={{
                gridTemplateColumns: 'repeat(24, minmax(0, 1fr))',
              }}
            >
              <p className="text-xs col-span-7 flex items-center break-all min-w-0">
                {l.roundNo}
              </p>
              <p className="text-xs col-span-7 flex items-center justify-center">
                {formatDate(l.drawTime, 'Mon dd hh:mm')}
              </p>
              <div className="col-span-10 flex justify-end *:ml-1">
                <ColorResult result={l.drawResult ?? ''} />
              </div>
            </div>
          ))}
        </div>
      )}
    />
  )
}

interface FourFiveDigitOrdersProps {
  gameID: number
  updateCode?: number
}

export const FourFiveDigitOrders = ({
  gameID,
  updateCode = 1,
}: FourFiveDigitOrdersProps) => (
  <PaginatedList
    updateCode={updateCode}
    pageSize={3}
    getResult={(a: number, n: number) =>
      getFourFiveDigitOrderList({
        pageNo: a,
        pageSize: n,
        gameID,
        orderStatus: 3,
      })
    }
    contentRender={(orders: FourFiveDigitOrderRecord[]) => (
      <div className="rounded p-2">
        {orders.map((n) => (
          <OrderItemWrapper
            key={n.orderGroup}
            item={n}
            className="mt-2 first:mt-0"
            resultRender={
              <div className="flex items-center *:ml-1">
                <ColorResult result={n.result ?? ''} />
              </div>
            }
          >
            <OrderDetail item={n} />
          </OrderItemWrapper>
        ))}
      </div>
    )}
  />
)
