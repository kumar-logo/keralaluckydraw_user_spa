import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { withLoading } from '../../utils/helpers'
import { useDigitPositionConfigStore } from '../../stores/digitPositionConfigStore'
import { DigitHistoryList, DigitHistoryRow } from './DigitHistoryList'
import { getThreeDigitManualHistory, DigitLatestDrawRow } from '../../services/threeDigitApi'

const PAGE_SIZE = 10

export const ThreeDigitResult = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [rows, setRows] = useState<DigitHistoryRow[]>([])
  const [pageNo, setPageNo] = useState(1)
  const [total, setTotal] = useState(0)
  const fetchPositionConfigs = useDigitPositionConfigStore((s) => s.fetchConfigs)

  const toRow = (draw: DigitLatestDrawRow): DigitHistoryRow => ({
    drawNo: draw.drawNo,
    result: (draw.drawResult || '').replace(/,/g, ''),
    drawTime: draw.drawTime,
    gameName: draw.gameName || t('result.digit.title'),
    icon: draw.icon,
  })

  const loadPage = useCallback(
    async (nextPage: number) => {
      const res = await getThreeDigitManualHistory(nextPage, PAGE_SIZE)
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
    navigate(`/result/digit/detail?id=${row.drawNo}&digitType=normal`)
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
