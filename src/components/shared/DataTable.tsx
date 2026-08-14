import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@nextui-org/react'
import { NoData } from './NoData'
import { ShowMore } from './ShowMore'
import { ChevronIcon } from './ChevronIcon'

interface Column<T> {
  title: React.ReactNode
  render: (item: T) => React.ReactNode
}

interface ExpandableRowProps<T> {
  item: T
  i: number
  expandRender?: (item: T, index: number) => React.ReactNode
  cols: Column<T>[]
}

const ExpandableRow = <T,>({ item, i, expandRender, cols }: ExpandableRowProps<T>) => {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <tr
        className={i % 2 ? 'bg-table-odd' : 'bg-table-even'}
        onClick={() => setExpanded((v) => !v)}
      >
        {cols.map((col, idx) => (
          <td
            key={idx}
            className="text-center first:text-left first:pl-2 last:text-right last:pr-2 py-2"
          >
            {col.render(item)}
          </td>
        ))}
        {expandRender && (
          <td className={`w-6 duration-200 ${expanded ? 'rotate-90' : 'rotate-0'}`}>
            <ChevronIcon className="mx-auto" />
          </td>
        )}
      </tr>
      {expanded && expandRender && (
        <tr>
          <td colSpan={5}>{expandRender(item, i)}</td>
        </tr>
      )}
    </>
  )
}

interface ColsTableProps<T> {
  result: T[]
  cols: Column<T>[]
  expandRender?: (item: T, index: number) => React.ReactNode
  className?: string
}

const ColsTable = <T,>({ result, cols, expandRender, className }: ColsTableProps<T>) => {
  const [showMore, setShowMore] = useState(false)
  const displayItems = useMemo(
    () => (result.length < 5 || showMore ? result : result.slice(0, 5)),
    [result, showMore]
  )
  const hasExpand = !!expandRender

  return (
    <div className={className}>
      <table className="w-full">
        <thead>
          <tr className="bg-table-header">
            {cols.map((col, idx) => (
              <th
                key={idx}
                className="text-xs capitalize font-medium text-center first:text-left first:pl-2 last:text-right last:pr-2 py-2"
              >
                {col.title}
              </th>
            ))}
            {hasExpand && <th className="w-6" />}
          </tr>
        </thead>
        <tbody>
          {displayItems.map((item, idx) => (
            <ExpandableRow
              key={idx}
              i={idx}
              cols={cols}
              item={item}
              expandRender={expandRender}
            />
          ))}
        </tbody>
      </table>
      {result.length > 5 && (
        <ShowMore className="mt-2" showMore={showMore} setShowMore={setShowMore} />
      )}
    </div>
  )
}

interface DataTableProps<T> {

  th?: React.ReactNode
  td?: (item: T, index: number) => React.ReactNode
  tdKey?: (item: T) => string | number
  dataList?: T[]
  more?: (pageNo: number, pageSize: number) => void
  pageNo?: number
  pageSize?: number
  total?: number
  tdWrapClassName?: string
  notuseInnerNodata?: boolean

  result?: T[]
  cols?: Column<T>[]
  expandRender?: (item: T, index: number) => React.ReactNode

  className?: string
}

export const DataTable = <T,>(props: DataTableProps<T>) => {
  const { t } = useTranslation()

  if (props.cols && props.result) {
    const { result, cols, expandRender, className } = props
    return <ColsTable result={result} cols={cols} expandRender={expandRender} className={className} />
  }

  const {
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
  } = props

  return (
    <div className={`flex flex-col rounded-lg overflow-hidden result-table ${className || ''}`}>
      <div className="bg-table-header flex py-2 text-xs text-sec result-table-th">
        {th}
      </div>

      {!notuseInnerNodata && (!dataList || !dataList.length) && (
        <div className="bg-light-gray h-72">
          <NoData />
        </div>
      )}

      {dataList.map((item, index) => {
        const rowKey = tdKey ? tdKey(item) : pageNo * pageSize + index
        return (
          <div
            key={rowKey}
            className={`flex text-sm text-sec odd:bg-table-odd even:bg-table-even ${tdWrapClassName || ''}`}
          >
            {td?.(item, index)}
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
