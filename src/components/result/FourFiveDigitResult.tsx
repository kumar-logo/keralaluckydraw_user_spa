import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { withLoading } from '../../utils/helpers'
import { useDigitPositionConfigStore } from '../../stores/digitPositionConfigStore'
import { DigitHistoryList, DigitHistoryRow } from './DigitHistoryList'
import { getFourFiveDigitManualHistory, FourFiveDigitLatestDraw } from '../../services/fourFiveDigitApi'

const PAGE_SIZE = 10

export const FourFiveDigitResult = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [rows, setRows] = useState<DigitHistoryRow[]>([])
  const [pageNo, setPageNo] = useState(1)
  const [total, setTotal] = useState(0)
  const fetchPositionConfigs = useDigitPositionConfigStore((s) => s.fetchConfigs)

  const toRow = (draw: FourFiveDigitLatestDraw): DigitHistoryRow => ({
    drawNo: draw.drawNo,
    result: (draw.drawResult || '').replace(/,/g, ''),
    drawTime: draw.drawTime,
    gameName: draw.gameName || t('result.mixDigit.title'),
    icon: draw.icon,
  })

  const loadPage = useCallback(
    async (nextPage: number) => {
      const res = await getFourFiveDigitManualHistory(nextPage, PAGE_SIZE)
      const list = Array.isArray(res?.content) ? res.content.map(toRow) : []
      setTotal(res?.totalSize ?? 0)
      setPageNo(nextPage)
      setRows((prev) => (nextPage === 1 ? list : [...prev, ...list]))
    },
    [t]
  )

  useEffect(() => {
    fetchPositionConfigs()
    withLoading(setLoading, loadPage(1))
  }, [])

  const onLoadMore = () => {
    setLoadingMore(true)
    loadPage(pageNo + 1).finally(() => setLoadingMore(false))
  }

  const goDetail = (row: DigitHistoryRow) => {
    localStorage.setItem('ResultDetails', JSON.stringify(row))
    navigate(`/result/5d/detail?id=${row.drawNo}`)
  }

  return (
    <DigitHistoryList
      rows={rows}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={rows.length < total}
      showEndMarker={total > PAGE_SIZE}
      onLoadMore={onLoadMore}
      onRowPress={goDetail}
    />
  )
}
