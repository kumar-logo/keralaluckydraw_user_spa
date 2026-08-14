import { useEffect } from 'react'
import { Pagination } from '../shared/Pagination'
import { NoData } from '../shared/NoData'
import { ColorOrderCard } from './ColorOrderCard'
import { usePagination } from '../../hooks/usePagination'
import { withLoading } from '../../utils/helpers'
import { formatDate } from '../../utils/date'
import { getColorOrderList } from '../../services/colorApi'
import type { ColorGameInfoDto, ColorOrderDto } from '../../services/colorApi'

interface ColorOrderProps {
  gameInfo: ColorGameInfoDto
  version: number
  tab: string
  setLoading: (loading: boolean) => void
}

export const ColorOrder = ({ gameInfo, version, tab, setLoading }: ColorOrderProps) => {
  const {
    resultList, resultPageNo, resultTotalPage, totalSize,
    init, refreshCurrentPage, refreshNextPage, refreshPrevPage,
  } = usePagination<ColorOrderDto>(
    (page, size) => {
      const colorID = gameInfo.tabs?.find((tabItem) => tabItem.tabMin + '' === tab)?.colorID
      if (!colorID) return Promise.resolve({ totalPages: 0, totalSize: 0, content: [] })
      return withLoading(setLoading, getColorOrderList({
        colorID,
        pageNo: page,
        size,
        orderStatus: 3,
        yearMonth: formatDate(new Date(), 'yyyyMM'),
      }))
    },
    { pageSize: 10, append: false }
  )

  useEffect(() => {
    init()
  }, [version])

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 8.875rem)' }}>
      <div className="flex flex-col px-2 pb-2">
        {resultList.length ? (
          resultList.map((item) => <ColorOrderCard key={item.roundNo} data={item} />)
        ) : (
          <div className="h-72"><NoData /></div>
        )}
      </div>
      <Pagination
        pageNo={resultPageNo}
        totalPage={resultTotalPage}
        totalSize={totalSize}
        onNext={refreshNextPage}
        onPage={refreshCurrentPage}
        onPrev={refreshPrevPage}
      />
    </div>
  )
}
