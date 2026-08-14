import { useState, useEffect, useMemo, createElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Spin } from '../shared/Spin'
import { NoData } from '../shared/NoData'
import { Pagination } from '../shared/Pagination'
import { OrderItemWrapper } from '../shared/OrderItemWrapper'
import { OrderStatusBadge } from '../shared/OrderStatusBadge'
import { DataTable } from '../shared/DataTable'
import { ShowMore } from '../shared/ShowMore'

const WinAmountBlock = ({ winAmount = 0 }: { winAmount?: number }) => {
  const { t } = useTranslation()
  return (
    <div
      className={`mt-2 text-center rounded bg-light-gray dark:bg-charcoal ${
        winAmount ? 'px-2 py-1 text-xs text-sec' : 'text-sm p-2'
      }`}
    >
      {winAmount ? (
        <>
          <p>{t('common.tip.info.orderWin')}</p>
          <p>
            {t('common.tip.info.orderWinAmount')}{' '}
            <span className="din text-base font-bold text-bg-sec">{formatCurrency(winAmount)}</span>
          </p>
        </>
      ) : (
        <p>{t('common.tip.info.orderNoWin')}</p>
      )}
    </div>
  )
}
import { AwardResult } from '../shared/AwardResult'
import { ChevronIcon } from '../shared/ChevronIcon'
import { KeralaDigitBall } from './KeralaDigitBall'
import { getKeralaOrderList, KeralaOrderRecord, KeralaOrderCodeEntry } from '../../services/keralaApi'
import { formatDate } from '../../utils/date'
import { formatCurrency } from '../../utils/format'
import { useAuthStore } from '../../stores/authStore'
import { checkAuth } from '../../utils/helpers'

const PAGE_SIZE = 10
const MAX_VISIBLE = 5

function KeralaOrderItem(props: KeralaOrderRecord) {
  const {
    orderGroup,
    keralaName,
    roundNo,
    drawTime,
    totalPrize,
    codeList,
    createTime,
    result1st,
    tags,
  } = props
  const [showMore, setShowMore] = useState(false)
  const { t } = useTranslation()
  const navigate = useNavigate()

  const status = useMemo(
    () =>
      totalPrize > 0
        ? 1
        : codeList.every((entry) => entry.status === 0)
          ? 0
          : 2,
    [codeList, totalPrize]
  )

  const totalAmount = useMemo(
    () => codeList.reduce((sum, entry) => sum + (entry.amount || 0), 0),
    [codeList]
  )

  const visibleList = useMemo(
    () => (codeList.length <= MAX_VISIBLE || showMore ? codeList : codeList.slice(0, MAX_VISIBLE)),
    [showMore, codeList]
  )

  return (
    <OrderItemWrapper
      className="mb-2"
      item={{
        gameName: keralaName,
        roundNo,
      }}
      Header={
        <div
          className="flex justify-between items-center"
          onClick={() => navigate('/result?key=kerala')}
        >
          <div className="flex-1 overflow-hidden text-sm text-main font-bold mr-2">
            <p className="flex items-center">
              {tags &&
                tags.split(',').map((tag) => (
                  <span
                    key={tag}
                    className="h-4 px-1 bg-[#EA1200] text-10 leading-4 rounded-xs mr-1 text-white uppercase"
                  >
                    {tag}
                  </span>
                ))}
              <span className="flex-1 truncate">{keralaName}</span>
            </p>
            <p className="mt-1">{roundNo}</p>
          </div>
          <div className="flex items-center gap-x-3">
            <div className="text-xs flex flex-col items-end">
              <p className="text-acc">
                {t('common.label.games.drawTime')}{' '}
                <span className="ml-2 text-sec">
                  {drawTime ? formatDate(drawTime, 'dd-MM hh:mm') : ''}
                </span>
              </p>
              <div className="flex items-center mt-1 gap-x-0.5">
                {(result1st || '-------').split('').map((char, charIdx) => (
                  <KeralaDigitBall key={charIdx} digit={char} outline={charIdx !== 0} />
                ))}
              </div>
            </div>
            <ChevronIcon />
          </div>
        </div>
      }
    >
      <div className="px-2 pb-2 border-b border-b-gray">
        <OrderStatusBadge status={status} code={orderGroup} />
      </div>

      <div className="p-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-main font-bold">
              {t('common.label.games.myBets')}
            </p>
            <p className="mt-1 text-xs text-acc">
              {t('common.label.games.bettingTime')}
              <span className="ml-2 text-sec">
                {createTime ? formatDate(createTime, 'dd-MM-yyyy hh:mm') : ''}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-acc">
              {t('common.label.games.totalPayment')}
            </p>
            <p className="din text-xs text-main font-bold text-right mt-1">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>

        {status > 0 ? <WinAmountBlock winAmount={totalPrize} /> : null}

        <DataTable
          dataList={visibleList}
          className="rounded-none mt-2"
          th={
            <div className="flex justify-between items-center px-2 flex-1">
              <div className="flex items-center text-left flex-1">
                {t('common.label.table.number')}
              </div>
              <div className="flex w-[4.8rem] justify-center text-center">
                {t('common.label.games.payment')}
              </div>
              <div className="flex w-20 justify-end text-right">
                {t('common.label.result')}
              </div>
            </div>
          }
          td={(entry: KeralaOrderCodeEntry) => {
            const digits = entry.code.split('')
            return (
              <div className="flex items-center justify-between py-2 flex-1 mx-2">
                <div className="flex items-center flex-1 gap-x-0.5">
                  {digits.map((char, charIdx) => (
                    <KeralaDigitBall key={charIdx} digit={char} outline={charIdx !== 0} />
                  ))}
                </div>
                <div className="flex w-[4.8rem] justify-center font-bold din">
                  {formatCurrency(entry.amount ?? 0)}
                </div>
                <div className="w-20">
                  <AwardResult
                    awardAmount={entry.prize}
                    hasDetail={false}
                    status={status === 0 ? 2 : (entry.prize ?? 0) > 0 ? 1 : 0}
                  />
                </div>
              </div>
            )
          }}
        />
        {codeList.length > MAX_VISIBLE && (
          <ShowMore showMore={showMore} setShowMore={setShowMore} />
        )}
      </div>
    </OrderItemWrapper>
  )
}

interface KeralaOrdersProps {
  keralaID: number
  refreshCode?: number
  gameCode?: string
}

export function KeralaOrders({
  keralaID,
  refreshCode,
  gameCode,
}: KeralaOrdersProps) {
  const token = useAuthStore((s) => s.token)
  const [loading, setLoading] = useState(false)
  const [totalSize, setTotalSize] = useState(0)
  const [firstLoad, setFirstLoad] = useState(true)
  const [list, setList] = useState<KeralaOrderRecord[]>([])
  const [pageNo, setPageNo] = useState(1)

  const fetchPage = async (page = 1) => {
    try {
      const yearMonth = formatDate(new Date(), 'yyyyMM')
      const data = await getKeralaOrderList(
        {
          keralaID,
          pageNo: page,
          size: PAGE_SIZE,
          orderStatus: 3,
          yearMonth,
        },
        gameCode || ''
      )
      if (data) {
        setList(data.content || [])
        setTotalSize(data.totalSize)
        setPageNo(page)
      }
    } finally {
      setLoading(false)
      setFirstLoad(false)
    }
  }

  useEffect(() => {
    if (keralaID) {
      if (!token) {
        checkAuth()
        setFirstLoad(false)
        return
      }
      fetchPage()
    }
  }, [keralaID])

  useEffect(() => {
    if (refreshCode && keralaID) {
      if (!token) {
        checkAuth()
        setFirstLoad(false)
        return
      }
      fetchPage()
    }
  }, [refreshCode])

  return (
    <Spin
      loading={firstLoad || loading}
      className="flex flex-col"
      style={{ minHeight: '100%' }}
    >
      <div className="p-2 gap-x-2">
        {list.map((item, index) => createElement(KeralaOrderItem, { ...item, key: index }))}
      </div>
      {list.length === 0 && !firstLoad && !loading && (
        <div className="flex-1 flex justify-center items-center">
          <NoData />
        </div>
      )}
      <Pagination
        onPrev={() => fetchPage(pageNo - 1)}
        onNext={() => fetchPage(pageNo + 1)}
        onPage={(page) => fetchPage(page)}
        totalPage={totalSize ? Math.ceil(totalSize / PAGE_SIZE) : 0}
        totalSize={totalSize}
        pageNo={pageNo}
      />
    </Spin>
  )
}
