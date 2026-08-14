import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, ScrollShadow } from '@nextui-org/react'
import { getTransactionTypes, getTransactionRecords, TransactionType, TransactionRecord } from '../services/financeApi'
import { formatCurrency } from '../utils/format'
import { formatDate } from '../utils/date'
import { withLoading } from '../utils/helpers'
import { TopBar } from '../components/shared/TopBar'
import { Spin } from '../components/shared/Spin'
import { MonthPickerModal } from '../components/shared/MonthPickerModal'

const pad2 = (n: number) => String(n).padStart(2, '0')

export const TransactionsPage = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [types, setTypes] = useState<TransactionType[]>([])
  const [selectedType, setSelectedType] = useState('')
  const [records, setRecords] = useState<TransactionRecord[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${pad2(now.getMonth() + 1)}`)
  const [pickerOpen, setPickerOpen] = useState(false)
  const monthLabel = useMemo(() => month.split('-').reverse().join('/'), [month])

  const monthRange = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    return {
      start: `${y}-${pad2(m)}-01`,
      end: `${y}-${pad2(m)}-${pad2(lastDay)}`,
    }
  }, [month])

  useEffect(() => {
    withLoading(setLoading, getTransactionTypes().then((data) => {
      const list = Array.isArray(data) ? data : data?.list || []
      setTypes([{ type: '', name: t('common.label.all') }, ...list])
    }))
  }, [t])

  const loadRecords = useCallback((type: string, pageNum: number, replace = false) => {
    const setter = pageNum === 1 ? setLoading : setLoadingMore
    withLoading(setter, getTransactionRecords(type, monthRange.start, monthRange.end, pageNum, 10).then((data) => {
      const content = data?.content || data?.list || []
      setRecords((prev) => (replace ? content : [...prev, ...content]))
      setTotalAmount(Number(data?.totalAmount || 0))
      setHasMore(content.length >= 10)
      setPage(pageNum)
    }))
  }, [monthRange])

  useEffect(() => {
    loadRecords(selectedType, 1, true)
  }, [selectedType, loadRecords])

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return
    loadRecords(selectedType, page + 1)
  }

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) handleLoadMore()
  }

  return (
    <div className="size-full flex flex-col">
      <TopBar title={t('common.label.transactions')} />

      <div className="bg-linear-primary-tr p-4 flex flex-col items-center text-black">
        <p className="text-xs font-bold opacity-70">{t('transactions.label.totalAmount')}</p>
        <p className="text-3xl font-black mt-1">{formatCurrency(totalAmount)}</p>
      </div>

      <div className="bg-white dark:bg-gray">
        <ScrollShadow orientation="horizontal" className="flex gap-1 p-2 overflow-x-auto">
          {types.map((tp) => (
            <Button
              key={tp.type}
              size="sm"
              className={`text-xs font-bold rounded-full px-4 shrink-0 ${
                selectedType === tp.type ? 'bg-primary text-black' : 'bg-selected text-main'
              }`}
              onPress={() => {
                setSelectedType(tp.type)
                setPage(1)
              }}
            >
              {tp.name}
            </Button>
          ))}
        </ScrollShadow>

        <div className="px-2 pb-2">
          <button
            onClick={() => setPickerOpen(true)}
            className="w-full flex items-center gap-2 bg-selected rounded-lg px-3 h-10"
          >
            <svg className="size-4 text-acc" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
            </svg>
            <span className="flex-1 text-left text-main text-sm font-bold">{monthLabel}</span>
            <svg className="size-3 text-acc" viewBox="0 0 8 12" fill="none">
              <path d="M1 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
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

      <Spin className="flex-1 flex flex-col min-h-0" loading={loading}>
        <ScrollShadow className="flex-1 p-2 min-h-0 overflow-y-auto" onScroll={handleScroll}>
          {records.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-acc">
              <svg className="size-16 mb-4 opacity-30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 10-.7.7l.27.28v.79l5 5L20.49 19zm-6 0A4.5 4.5 0 1114 9.5 4.5 4.5 0 019.5 14z" />
              </svg>
              <p className="text-sm">{t('common.label.noData')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((record) => (
                <div key={record.id} className="p-3 bg-white dark:bg-gray rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-main">{record.remark || record.sourceType}</span>
                    <span className={`text-sm font-black ${record.amount >= 0 ? 'text-[#009919]' : 'text-[#E20000]'}`}>
                      {record.amount >= 0 ? '+' : ''}{formatCurrency(record.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-acc">{formatDate(record.createTime)}</span>
                    <span className="text-xs text-acc">{t('common.label.balance')}: {formatCurrency(record.balance)}</span>
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="flex justify-center py-3">
                  <Button
                    size="sm"
                    isLoading={loadingMore}
                    className="text-xs text-primary bg-transparent font-bold"
                    onPress={handleLoadMore}
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

export default TransactionsPage
