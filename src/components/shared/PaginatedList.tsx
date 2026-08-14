import { useState, useEffect } from 'react'
import { ScrollShadow } from '@nextui-org/react'
import clsx from 'clsx'
import { Spin } from './Spin'
import { Pagination } from './Pagination'
import { NoData } from './NoData'
import { withLoading } from '../../utils/helpers'

interface PaginatedResult<T> {
  content?: T[]
  totalSize?: number
}

interface PaginatedListProps<T> {
  getResult: (page: number, pageSize: number) => Promise<PaginatedResult<T>>
  pageSize?: number
  contentRender: (items: T[]) => React.ReactNode
  updateCode: number
  className?: string
  dropClassName?: string
  headRender?: React.ReactNode
  contentWapperClassName?: string
}

export const PaginatedList = <T,>({
  getResult,
  pageSize = 10,
  contentRender,
  updateCode,
  className,
  dropClassName,
  headRender,
  contentWapperClassName,
}: PaginatedListProps<T>) => {
  const [loading, setLoading] = useState(false)
  const [totalSize, setTotalSize] = useState(0)
  const [items, setItems] = useState<T[]>([])
  const [pageNo, setPageNo] = useState(1)

  const fetchPage = (page = pageNo) =>
    getResult(page, pageSize).then((result) => {
      setItems(result.content || [])
      setTotalSize(result.totalSize ?? 0)
      setPageNo(page)
    })

  const loadPage = (page = pageNo) => {
    withLoading(setLoading, fetchPage(page))
  }

  useEffect(() => {
    if (updateCode) loadPage()
  }, [updateCode])

  return (
    <Spin loading={loading} className={clsx('flex-col size-full', className)} dropClassName={dropClassName}>
      <div className={clsx('flex-1 flex flex-col overflow-hidden', contentWapperClassName)}>
        {headRender}
        <ScrollShadow className="flex flex-col flex-1 overflow-x-hidden overflow-y-auto">
          {items.length > 0 && contentRender(items)}
          {items.length === 0 && !loading && (
            <div className="flex-1 flex justify-center items-center">
              <NoData />
            </div>
          )}
        </ScrollShadow>
      </div>
      <Pagination
        onPrev={() => loadPage(pageNo - 1)}
        onNext={() => loadPage(pageNo + 1)}
        onPage={(page) => loadPage(page)}
        totalPage={totalSize ? Math.ceil(totalSize / pageSize) : 0}
        totalSize={totalSize}
        pageNo={pageNo}
      />
    </Spin>
  )
}
