import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { withLoading } from '../../utils/helpers'
import { useDigitPositionConfigStore } from '../../stores/digitPositionConfigStore'
import { DigitHistoryList, DigitHistoryRow } from './DigitHistoryList'
import { getThreeDigitQuickDraw, DigitLatestDrawRow } from '../../services/threeDigitApi'
import { getFourFiveDigitQuickDraw, FourFiveDigitLatestDraw } from '../../services/fourFiveDigitApi'

interface QuickRow extends DigitHistoryRow {
  isFiveDigit: boolean
}

const drawTimeValue = (drawTime: string): number => {
  const ms = new Date(drawTime).getTime()
  return Number.isFinite(ms) ? ms : 0
}

export const QuickDigitsResult = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<QuickRow[]>([])
  const fetchPositionConfigs = useDigitPositionConfigStore((s) => s.fetchConfigs)

  const toThreeRow = (draw: DigitLatestDrawRow): QuickRow => ({
    drawNo: draw.drawNo,
    result: (draw.drawResult || '').replace(/,/g, ''),
    drawTime: draw.drawTime,
    gameName: draw.gameName || t('result.quickDigit.title'),
    icon: draw.icon,
    isFiveDigit: false,
  })

  const toFiveRow = (draw: FourFiveDigitLatestDraw): QuickRow => ({
    drawNo: draw.drawNo,
    result: (draw.drawResult || '').replace(/,/g, ''),
    drawTime: draw.drawTime,
    gameName: draw.gameName || t('result.mixDigit.title'),
    icon: draw.icon,
    isFiveDigit: true,
  })

  const load = () =>
    Promise.all([getThreeDigitQuickDraw(), getFourFiveDigitQuickDraw()]).then(([threeRes, fiveRes]) => {
      const three = Array.isArray(threeRes) ? threeRes.map(toThreeRow) : []
      const five = Array.isArray(fiveRes) ? fiveRes.map(toFiveRow) : []
      const merged = [...three, ...five].sort((a, b) => drawTimeValue(b.drawTime) - drawTimeValue(a.drawTime))
      setRows(merged)
    })

  useEffect(() => {
    fetchPositionConfigs()
    withLoading(setLoading, load())
  }, [])

  const goDetail = (row: DigitHistoryRow) => {
    const quickRow = row as QuickRow
    localStorage.setItem('ResultDetails', JSON.stringify(row))
    if (quickRow.isFiveDigit) {
      navigate(`/result/5d/detail?id=${row.drawNo}`)
    } else {
      navigate(`/result/digit/detail?id=${row.drawNo}&digitType=quick`)
    }
  }

  return (
    <DigitHistoryList
      rows={rows}
      loading={loading}
      loadingMore={false}
      hasMore={false}
      onRowPress={goDetail}
    />
  )
}
