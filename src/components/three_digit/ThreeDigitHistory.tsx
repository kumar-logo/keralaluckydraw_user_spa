import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getThreeDigitDrawHistory, ThreeDigitDrawRow } from '../../services/threeDigitApi'
import { formatDate } from '../../utils/date'
import { Spin } from '../shared/Spin'
import { Pagination } from '../shared/Pagination'
import { DataListView } from '../shared/DataListView'
import { ColorBall } from '../four_five_digit/ColorBall'

const PAGE_SIZE = 10

interface ThreeDigitHistoryProps {
  type?: string
  pickThreeId?: number
  refreshCode?: number
}

export const ThreeDigitHistory = ({
  pickThreeId = 0,
  refreshCode = 0,
}: ThreeDigitHistoryProps) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [totalSize, setTotalSize] = useState(0)
  const [initialLoad, setInitialLoad] = useState(false)
  const [items, setItems] = useState<ThreeDigitDrawRow[]>([])
  const [pageNo, setPageNo] = useState(1)

  const fetchNormal = (page = 1) => {
    if (initialLoad) return
    setLoading(true)
    getThreeDigitDrawHistory(pickThreeId, page, PAGE_SIZE)
      .then((data) => {
        setItems(data.drawResultList || [])
        setTotalSize(data.totalCount)
        setPageNo(page)
      })
      .finally(() => {
        setInitialLoad(false)
        setLoading(false)
      })
  }

  useEffect(() => {
    if (pickThreeId) fetchNormal()
  }, [pickThreeId])

  useEffect(() => {
    if (refreshCode > 0 && pickThreeId) fetchNormal()
  }, [refreshCode])

  const fetchPage = (page: number) => {
    fetchNormal(page)
  }

  return (
    <Spin
      loading={initialLoad || loading}
      className="flex flex-col"
      style={{ minHeight: '100%' }}
    >
      <div className="p-2">
        <DataListView
          className="rounded-none digit-result"
          dataList={items}
          th={
            <div className="flex flex-1 items-center mx-2 justify-between">
              <div className="flex-1 flex-center">
                {t('common.label.table.issue')}
              </div>
              <div className="flex-1 flex items-center justify-center">
                {t('common.label.table.time')}
              </div>
              <div className="flex-1 flex items-center justify-end gap-1">
                {t('common.label.table.number')}
              </div>
            </div>
          }
          td={(row: ThreeDigitDrawRow) => (
            <div className="flex flex-1 items-center mx-2 justify-between py-3">
              <div className="flex-1 text-sec text-xs">
                {row.pickNo || row.roundNo}
              </div>
              <div className="flex-1 font-medium flex items-center justify-center text-xs">
                {formatDate(row.drawTime, 'dd-MM hh:mm')}
              </div>
              <div className="flex items-center justify-end gap-1 flex-1">
                {(row.drawResult ?? '').split('').map((digit: string, j: number) => (
                  <ColorBall
                    key={j}
                    index={j}
                    ballSize="1.5rem"
                    fontSize="0.875rem"
                    digit={digit}
                  />
                ))}
              </div>
            </div>
          )}
        />
      </div>
      <Pagination
        onPrev={() => fetchPage(pageNo - 1)}
        onNext={() => fetchPage(pageNo + 1)}
        onPage={(p) => fetchPage(p)}
        totalPage={totalSize ? Math.ceil(totalSize / PAGE_SIZE) : 0}
        totalSize={totalSize}
        pageNo={pageNo}
      />
    </Spin>
  )
}
