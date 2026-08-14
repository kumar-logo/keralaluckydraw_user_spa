import { useState, useEffect, useMemo, useCallback, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { apiPost } from '../../services/api'
import {
  ThreeDigitOrderList,
  ThreeDigitOrderRecord,
} from '../../services/threeDigitApi'
import { DigitCodeEntry } from '../order_detail/orderDetailTypes'
import { formatDate } from '../../utils/date'
import { formatCurrency } from '../../utils/format'
import { useAuthStore } from '../../stores/authStore'
import { checkAuth } from '../../utils/helpers'
import { Spin } from '../shared/Spin'
import { Pagination } from '../shared/Pagination'
import { NoData } from '../shared/NoData'
import { OrderItemWrapper } from '../shared/OrderItemWrapper'
import { DataTable } from '../shared/DataTable'
import { ColorBall } from '../four_five_digit/ColorBall'
import { DigitBallRow } from '../shared/DigitBallRow'
import { usePositionConfig } from '../../config/positionContext'

const getNormalOrders = (
  gameID: number,
  pageNo: number,
  size: number,
  roundNo?: string,
  yearMonth?: string,
) =>
  apiPost<ThreeDigitOrderList>('/game/api/three_digit/v1/order/list', {
    gameID,
    pageNo,
    orderStatus: 3,
    size,
    ...(roundNo ? { roundNo } : {}),
    yearMonth: yearMonth || formatDate(new Date(), 'yyyyMM'),
  })

const PAGE_SIZE = 3

const STATUS_TO_BE_DRAWN = 0
const STATUS_WON = 1
const STATUS_NO_WIN = 2

const renderIndexCode = (indexCode: string): ReactNode => {
  const [positions, digits] = (indexCode || '').split('=')
  return <DigitBallRow digits={digits ?? ''} positions={positions ?? ''} />
}

const ThreeDigitOrderItem = ({ item }: { item: ThreeDigitOrderRecord }) => {
  const { t } = useTranslation()
  const { labels } = usePositionConfig()
  const codeLists = item.codeLists ?? []

  const drawn = !!item.wonCode && item.wonCode !== '***' && !item.wonCode.startsWith('*')
  const status = useMemo(() => {
    if (!item.wonCode || item.wonCode === '***') return STATUS_TO_BE_DRAWN
    return (item.winAmount ?? 0) > 0 ? STATUS_WON : STATUS_NO_WIN
  }, [item.wonCode, item.winAmount])

  const resultDigits = useMemo(
    () =>
      item.wonCode
        ? item.wonCode.split('')
        : new Array(labels.length || 3).fill('*'),
    [item.wonCode, labels.length]
  )

  return (
    <OrderItemWrapper
      className="mt-2 first:mt-0"
      item={{
        gameName: item.gameName,
        roundNo: item.roundNo,
        orderGroup: item.orderGroup,
        drawTime: item.drawTime,
        status,
        totalAmount: item.totalAmount,
        totalPrize: item.winAmount,
        createTime: item.createTime,
      }}
      resultRender={
        <div className="flex items-center *:ml-1">
          {resultDigits.map((digit, index) => (
            <ColorBall key={index} index={index} digit={digit} />
          ))}
        </div>
      }
    >
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
            render: (entry: DigitCodeEntry) => {
              const prize = entry.codeWinAmount || entry.winAmount || entry.prize || 0
              return (
                <div className="flex flex-col items-end ml-2">
                  <span className="text-sec text-xs">
                    {!drawn ? t('common.label.toBeDrawn') : prize > 0 ? t('common.label.won') : t('common.label.nowin')}
                  </span>
                  <span className={`din text-sm font-bold ${drawn && prize > 0 ? 'text-bg-sec' : 'text-main'}`}>
                    {drawn ? formatCurrency(prize) : '...'}
                  </span>
                </div>
              )
            },
          },
        ]}
      />
    </OrderItemWrapper>
  )
}

interface ThreeDigitOrdersProps {
  type?: string
  pickThreeId?: number
  refreshCode?: number
  selectedRoundNo?: string
}

export const ThreeDigitOrders = ({
  pickThreeId,
  refreshCode = 0,
  selectedRoundNo = '',
}: ThreeDigitOrdersProps) => {
  const token = useAuthStore((s) => s.token)
  const [totalSize, setTotalSize] = useState(0)
  const [initialLoad, setInitialLoad] = useState(true)
  const [normalItems, setNormalItems] = useState<ThreeDigitOrderRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [pageNo, setPageNo] = useState(1)

  const fetchNormal = useCallback(async (page = 1) => {
    if (pickThreeId == null) {
      setInitialLoad(false)
      return
    }
    try {
      setLoading(true)
      const data = await getNormalOrders(pickThreeId, page, PAGE_SIZE, selectedRoundNo)
      setTotalSize(data.totalSize)
      setNormalItems(data.content || [])
      setPageNo(page)
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }, [pickThreeId, selectedRoundNo])

  useEffect(() => {
    if (!token) {
      checkAuth()
      setInitialLoad(false)
      return
    }
    fetchNormal()
  }, [fetchNormal])

  useEffect(() => {
    if (refreshCode > 0) {
      if (!token) return
      fetchNormal()
    }
  }, [refreshCode])

  const handlePage = (page: number) => {
    fetchNormal(page)
  }

  return (
    <Spin
      loading={initialLoad || loading}
      className="flex flex-col gap-x-2"
      style={{ minHeight: '100%' }}
    >
      <div className="p-2">
        {normalItems.map((item, idx) => (
          <ThreeDigitOrderItem key={item.orderGroup ?? idx} item={item} />
        ))}
      </div>

      {normalItems.length === 0 && !initialLoad && !loading && (
        <div className="h-72">
          <NoData />
        </div>
      )}

      <Pagination
        onPrev={() => handlePage(pageNo - 1)}
        onNext={() => handlePage(pageNo + 1)}
        onPage={(p) => handlePage(p)}
        totalPage={totalSize ? Math.ceil(totalSize / PAGE_SIZE) : 0}
        totalSize={totalSize}
        pageNo={pageNo}
      />
    </Spin>
  )
}
