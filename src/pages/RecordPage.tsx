import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, ScrollShadow } from '@nextui-org/react'
import { apiPost } from '../services/api'
import { FinanceRecord, FinanceRecordList } from '../services/financeApi'
import { formatCurrency } from '../utils/format'
import { formatDate } from '../utils/date'
import { withLoading } from '../utils/helpers'
import { TopBar } from '../components/shared/TopBar'
import { Spin } from '../components/shared/Spin'

const API_MAP: Record<string, string> = {
  recharge: '/hall/api/finance/v1/rc/records',
  withdraw: '/hall/api/finance/v1/wd/records',
  transfer: '/hall/api/finance/v1/trf/records',
}

const TITLE_MAP: Record<string, string> = {
  recharge: 'common.label.rechargeRecords',
  withdraw: 'common.label.withdrawRecords',
  transfer: 'common.label.transferRecords',
}

const STATUS_OPTIONS = [
  { key: '', label: 'common.label.all' },
  { key: '0', label: 'record.status.pending' },
  { key: '1', label: 'record.status.success' },
  { key: '2', label: 'record.status.failed' },
]

export const RecordPage = () => {
  const { slug = 'recharge' } = useParams<{ slug: string }>()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [records, setRecords] = useState<FinanceRecord[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const apiUrl = API_MAP[slug] || API_MAP.recharge
  const title = t(TITLE_MAP[slug] || TITLE_MAP.recharge)

  const loadRecords = useCallback((status: string, pageNum: number, replace = false) => {
    const setter = pageNum === 1 ? setLoading : setLoadingMore
    const params: { pageNo: number; pageSize: number; status?: number } = { pageNo: pageNum, pageSize: 10 }
    if (status) params.status = Number(status)

    withLoading(setter, apiPost<FinanceRecordList>(apiUrl, params).then((data) => {
      const content = data?.content || data?.list || []
      if (replace) {
        setRecords(content)
      } else {
        setRecords((prev) => [...prev, ...content])
      }
      setHasMore(content.length >= 10)
      setPage(pageNum)
    }))
  }, [apiUrl])

  useEffect(() => {
    loadRecords(statusFilter, 1, true)
  }, [statusFilter, slug, loadRecords])

  const getStatusStyle = (s: number) => {
    if (s === 0) return 'text-[#1776FF]'
    if (s === 1) return 'text-[#009919]'
    if (s === 2) return 'text-[#E20000]'
    return 'text-acc'
  }

  const getStatusLabel = (s: number) => {
    if (s === 0) return t('record.status.pending')
    if (s === 1) return t('record.status.success')
    if (s === 2) return t('record.status.failed')
    return '--'
  }

  return (
    <div className="size-full flex flex-col">
      <TopBar title={title} />

      <div className="bg-white dark:bg-gray">
        <ScrollShadow orientation="horizontal" className="flex gap-1 p-2 overflow-x-auto">
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.key}
              size="sm"
              className={`text-xs font-bold rounded-full px-3 shrink-0 ${
                statusFilter === opt.key ? 'bg-primary text-black' : 'bg-selected text-main'
              }`}
              onPress={() => { setStatusFilter(opt.key); setPage(1) }}
            >
              {t(opt.label)}
            </Button>
          ))}
        </ScrollShadow>
      </div>

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
              {records.map((record) => (
                <div key={record.id || record.orderId || record.orderNo} className="p-3 bg-white dark:bg-gray rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-main">
                      {formatCurrency(record.amount)}
                    </span>
                    <span className={`text-xs font-bold ${getStatusStyle(record.status)}`}>
                      {getStatusLabel(record.status)}
                    </span>
                  </div>
                  {slug === 'transfer' && (
                    <div className="text-xs font-bold text-[#009919] mb-1">
                      +{formatCurrency(record.giveAmount ?? 0)} {t('recharge.transfer.records.reward')}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-acc">{formatDate(record.createTime)}</span>
                    {record.channel && (
                      <span className="text-[10px] text-acc">{record.channel}</span>
                    )}
                  </div>
                  {(record.orderId || record.orderNo) && (
                    <div className="text-[10px] text-acc mt-1 truncate">
                      {t('record.label.orderId')}: {record.orderId || record.orderNo}
                    </div>
                  )}
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

export default RecordPage
