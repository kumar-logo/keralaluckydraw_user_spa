import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Image, ScrollShadow, Tabs, Tab } from '@nextui-org/react'
import { getRebateRecords, receiveRebate, type RebateRecordDto } from '../services/financeApi'
import { formatCurrency } from '../utils/format'
import { formatDate } from '../utils/date'
import { toast } from '../utils/toast'
import { withLoading } from '../utils/helpers'
import { TopBar } from '../components/shared/TopBar'
import { Spin } from '../components/shared/Spin'
import { MonthPickerModal } from '../components/shared/MonthPickerModal'

const pad2 = (n: number) => String(n).padStart(2, '0')

const STATUS_COLORS = ['#E20000', '#1776FF', '#009919']
const STATUS_BG = ['rebateLinearGradientOne', 'rebateLinearGradientTwo', 'rebateLinearGradientThree']

export const RebatePage = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [records, setRecords] = useState<RebateRecordDto[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [statusFilter, setStatusFilter] = useState(0)

  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${pad2(now.getMonth() + 1)}`)
  const [pickerOpen, setPickerOpen] = useState(false)
  const monthLabel = useMemo(() => month.split('-').reverse().join('/'), [month])
  const monthRange = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    return { start: `${y}-${pad2(m)}-01`, end: `${y}-${pad2(m)}-${pad2(lastDay)}` }
  }, [month])

  const loadRecords = useCallback((status: number, pageNum: number, replace = false) => {
    withLoading(pageNum === 1 ? setLoading : setLoadingMore, getRebateRecords(status, monthRange.start, monthRange.end, pageNum, 10).then((data) => {
      const content = data.content ?? data.list ?? []
      if (replace) {
        setRecords(content)
      } else {
        setRecords((prev) => [...prev, ...content])
      }
      setHasMore(content.length >= 10)
      setPage(pageNum)
    }))
  }, [monthRange])

  useEffect(() => {
    loadRecords(statusFilter, 1, true)
  }, [statusFilter, loadRecords])

  const handleClaim = (item: RebateRecordDto) => {
    if (item.rebateAmount <= 0) return
    withLoading(setClaiming, receiveRebate(item.id).then(() => {
      toast.show({ message: 'Successfully', icon: 'success' })
      loadRecords(statusFilter, 1, true)
    }))
  }

  const formatRebateDate = (time: string | number) => {
    const dayKey = formatDate(time, 'yyyy-MM-dd')
    const todayKey = formatDate(Date.now(), 'yyyy-MM-dd')
    const yesterdayKey = formatDate(Date.now() - 86400000, 'yyyy-MM-dd')
    if (dayKey === todayKey) return t('rebate.today')
    if (dayKey === yesterdayKey) return t('rebate.yesterday')
    return formatDate(time, 'Mon dd')
  }

  const statusLabels = [t('rebate.undone'), t('rebate.unclaimed'), t('rebate.completed')]

  return (
    <div className="size-full flex flex-col">
      <TopBar title={t('common.label.rebate')} />

      <div className="bg-white dark:bg-gray px-2 flex items-center gap-2">
        <Tabs
          selectedKey={statusFilter + ''}
          onSelectionChange={(k) => setStatusFilter(Number(k))}
          classNames={{
            base: 'flex-1 min-w-0',
            tabList: 'w-full flex p-0',
            tab: 'flex-1 h-10',
          }}
        >
          <Tab key="0" title={statusLabels[0]} />
          <Tab key="1" title={statusLabels[1]} />
          <Tab key="2" title={statusLabels[2]} />
        </Tabs>
        <button
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-1 shrink-0 text-main text-sm font-bold"
        >
          <svg className="size-4 text-acc" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
          </svg>
          {monthLabel}
          <svg className="size-3 text-acc" viewBox="0 0 8 12" fill="none">
            <path d="M1 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <MonthPickerModal
        isOpen={pickerOpen}
        onOpenChange={setPickerOpen}
        value={month}
        onConfirm={(m) => {
          setMonth(m)
          setPage(1)
        }}
      />

      <Spin className="flex-1 flex flex-col" loading={loading}>
        <ScrollShadow className="flex-1 p-2">
          {records.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-acc">
              <svg className="size-16 mb-4 opacity-30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6H4V4h16v2zm-2 6H6V10h12v2zm-4 6H10v-2h4v2z" />
              </svg>
              <p className="text-sm">{t('common.label.noData')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((item) => (
                <div key={item.id} className="px-3 py-2 bg-selected rounded-lg">
                  <div className={`flex justify-between items-center rebateLinearGradient px-3 py-2 ${STATUS_BG[item.receiveStatus]}`}>
                    <span className="text-sec font-bold text-sm">{formatRebateDate(item.createTime)}</span>
                    <span className="text-xs font-bold" style={{ color: STATUS_COLORS[item.receiveStatus] }}>
                      {statusLabels[item.receiveStatus]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center">
                      <div className="w-6 h-6 mr-1">
                        <Image src="/images/rebate/coin.webp" alt="money" className="w-6 h-6 z-0" />
                      </div>
                      <span className="text-primary font-black text-xs">{formatCurrency(item.rebateAmount)}</span>
                    </div>
                    {item.receiveStatus === 1 && (
                      <Button
                        size="sm"
                        isLoading={claiming}
                        className="h-7 min-w-17 text-10! bg-primary text-black font-bold rounded-full"
                        onPress={() => handleClaim(item)}
                      >
                        {t('rebate.receive')}
                      </Button>
                    )}
                  </div>
                  <div className="text-xs text-acc mt-1">
                    {t('rebate.label.betAmount')}: {formatCurrency(item.betAmount)}
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="flex justify-center py-3">
                  <Button
                    size="sm"
                    isLoading={loadingMore}
                    className="text-xs text-primary bg-transparent font-bold"
                    onPress={() => loadRecords(statusFilter, page + 1)}
                  >
                    {t('common.label.loadMore')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollShadow>
      </Spin>
    </div>
  )
}

export default RebatePage
