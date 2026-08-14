import { useState, useEffect, useRef, useMemo, useCallback } from 'react'


interface PaginationOptions {
  pageSize?: number
  append?: boolean
}

interface PaginationResult<T> {
  init: () => Promise<void>
  refreshNextPage: () => Promise<void> | void
  refreshPrevPage: () => Promise<void> | void
  refreshCurrentPage: (page: number) => Promise<void> | void
  reset: () => void
  resultList: T[]
  isEnd: boolean
  totalSize: number
  resultPageNo: number
  resultTotalPage: number
  isLoading: boolean
  initLoading: boolean
}

interface PaginatedResponse<T> {
  content?: T[]
  totalPages?: number
  totalSize?: number
}

export function usePagination<T = unknown>(
  fetcher: (page: number, pageSize: number) => Promise<PaginatedResponse<T>>,
  options: PaginationOptions = { pageSize: 10 }
): PaginationResult<T> {
  const { pageSize: defaultPageSize = 10, append = true } = options
  const pageRef = useRef(1)
  const pageSizeRef = useRef(defaultPageSize)
  const totalPagesRef = useRef(1)
  const [totalSize, setTotalSize] = useState(0)
  const [updateKey, setUpdateKey] = useState(0)
  const [pageNo, setPageNo] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  // `updateKey` is a manual invalidation signal: these values are derived from
  // refs (which don't trigger re-renders), so we recompute whenever the page
  // state bumps updateKey. updateKey is intentionally the sole dependency.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isEnd = useMemo(() => pageRef.current >= totalPagesRef.current, [updateKey])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const totalPage = useMemo(() => totalPagesRef.current, [updateKey])
  const [resultList, setResultList] = useState<T[]>([])
  const loadingRef = useRef(false)

  useEffect(() => {
    pageSizeRef.current = defaultPageSize
  }, [defaultPageSize])

  const load = useCallback(() => {
    if (loadingRef.current) return Promise.resolve()
    if (pageRef.current > totalPagesRef.current && pageRef.current > 1)
      return Promise.resolve()
    loadingRef.current = true
    setIsLoading(true)
    const promise = fetcher(pageRef.current, pageSizeRef.current).then((res) => {
      totalPagesRef.current = res.totalPages || totalPagesRef.current
      setTotalSize((prev) => res.totalSize || (res.content?.length ? prev : 0))
      setPageNo(Math.min(pageRef.current, totalPagesRef.current))
      setUpdateKey((k) => k + 1)
      if (pageRef.current > 1 && append) {
        setResultList((prev) => [...prev, ...(res.content || [])])
      } else {
        setResultList(res.content || [])
      }
    })
    promise.finally(() => {
      loadingRef.current = false
      setIsLoading(false)
    })
    return promise
  }, [fetcher, append])

  const [initLoading, setInitLoading] = useState(true)

  const init = () => {
    pageRef.current = 1
    totalPagesRef.current = 1
    setInitLoading(true)
    return load().finally(() => setInitLoading(false))
  }

  const refreshNextPage = () => goToPage(pageRef.current + 1)
  const refreshPrevPage = () => goToPage(pageRef.current - 1)

  const goToPage = (p: number) => {
    pageRef.current = p
    if (pageRef.current > totalPagesRef.current) {
      pageRef.current = totalPagesRef.current
      setUpdateKey((k) => k + 1)
      return Promise.resolve()
    }
    if (pageRef.current <= 0) {
      pageRef.current = 1
      setUpdateKey((k) => k + 1)
      return Promise.resolve()
    }
    setUpdateKey((k) => k + 1)
    return load()
  }

  return {
    init,
    refreshNextPage,
    refreshPrevPage,
    refreshCurrentPage: goToPage,
    reset: () => {
      pageRef.current = 1
      totalPagesRef.current = 1
      setTotalSize(0)
      setResultList([])
    },
    resultList,
    isEnd,
    totalSize,
    resultPageNo: pageNo,
    resultTotalPage: totalPage,
    isLoading,
    initLoading,
  }
}
