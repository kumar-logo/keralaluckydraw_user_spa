import { useTranslation } from 'react-i18next'
import { Button } from '@nextui-org/react'
import { NoData } from './NoData'

interface DataListViewProps<T> {
  th: React.ReactNode
  td: (item: T, index: number) => React.ReactNode
  tdKey?: (item: T) => string | number
  dataList?: T[]
  more?: (page: number, pageSize: number) => void
  pageNo?: number
  pageSize?: number
  total?: number
  className?: string
  tdWrapClassName?: string
  notuseInnerNodata?: boolean
}

export const DataListView = <T,>({
  th,
  td,
  tdKey,
  dataList = [],
  more,
  pageNo = 1,
  pageSize = 10,
  total = 0,
  className,
  tdWrapClassName,
  notuseInnerNodata = false,
}: DataListViewProps<T>) => {
  const { t } = useTranslation()

  return (
    <div className={`flex flex-col rounded-lg overflow-hidden result-table ${className}`}>
      <div className="bg-table-header flex py-2 text-xs text-sec result-table-th">
        {th}
      </div>

      {!notuseInnerNodata && (!dataList || !dataList.length) && (
        <div className="bg-light-gray h-72">
          <NoData />
        </div>
      )}

      {dataList.map((item, idx) => {
        const key = tdKey ? tdKey(item) : pageNo * pageSize + idx
        return (
          <div
            key={key}
            className={`flex text-sm text-sec odd:bg-table-odd even:bg-table-even ${tdWrapClassName || ''}`}
          >
            {td(item, idx)}
          </div>
        )
      })}

      {pageNo * pageSize < total && more && (
        <div className="flex p-3 bg-white">
          <Button
            className="result-show-more px-0 min-w-0 gap-0 flex items-center justify-center flex-1 p-3"
            onPress={() => more(pageNo + 1, pageSize)}
          >
            <span className="pr-2.5 text-xs font-bold button-more uppercase">
              {t('common.label.showMore')}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text-sec-acc"
              width=".75rem"
              height=".8125rem"
              fill="none"
            >
              <path
                d="M2.77778 5.5L5.88889 8.61111L9 5.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </div>
      )}
    </div>
  )
}
