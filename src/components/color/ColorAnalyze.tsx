import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@nextui-org/react'
import { ResultTable } from '../shared/ResultTable'
import { Pagination } from '../shared/Pagination'
import { FullBall } from '../shared/WingoBall'
import type { ColorHistoryItem } from '../../services/colorApi'

interface ColorAnalyzeProps {
  latestLottery: {
    pageNo: number
    totalPage: number
    totalSize: number
    onNext: () => Promise<void> | void
    onPage: (page: number) => Promise<void> | void
    onPrev: () => Promise<void> | void
    list: ColorHistoryItem[]
  }
}

export const ColorAnalyze = ({ latestLottery: { pageNo, totalPage, totalSize, onNext, onPage, onPrev, list } }: ColorAnalyzeProps) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  const safeCall = (result: Promise<void> | void) => {
    setLoading(true)
    Promise.resolve(result).finally(() => setLoading(false))
  }

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 8.875rem)' }}>
      <ResultTable
        className="rounded-none px-2 pb-2"
        tdWrapClassName="py-0"
        th={
          <div className="flex flex-1 items-center mx-3 uppercase">
            <div className="flex-1 text-left">{t('common.label.table.issue')}</div>
            <div className="flex-2 text-right">{t('wingo.table.number')}</div>
          </div>
        }
        dataList={loading ? Array(10).fill(null) : list}
        td={(item: ColorHistoryItem | null) => (
          <div className="flex flex-1 items-center mx-3 h-12">
            {loading || !item ? (
              <Skeleton className="flex flex-1 h-4" />
            ) : (
              <>
                <div className="flex-1 text-left text-xs text-main">{item.issueNo}</div>
                <div className="flex justify-end gap-x-0.5 relative">
                  {Array(10).fill(0).map((_, b) => (
                    <div key={b} className="z-10 text-main">
                      <FullBall size={20} textSize={12} content={b} none={b !== item.number} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      />
      <Pagination
        onPrev={() => safeCall(onPrev())}
        onNext={() => safeCall(onNext())}
        onPage={(p) => safeCall(onPage(p))}
        totalPage={totalPage}
        totalSize={totalSize}
        pageNo={pageNo}
      />
    </div>
  )
}
