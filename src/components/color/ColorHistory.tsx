import { useTranslation } from 'react-i18next'
import { ResultTable } from '../shared/ResultTable'
import { Pagination } from '../shared/Pagination'
import type { ColorHistoryItem } from '../../services/colorApi'

function resultColorText(num: number) {
  return num % 2 === 0 ? 'red' : 'green'
}

function resultColors(num: number) {
  const colors: string[] = []
  if (num % 2 === 0) colors.push('red')
  else colors.push('green')
  if (num % 5 === 0) colors.push('violet')
  return colors
}

interface ColorHistoryProps {
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

export const ColorHistory = ({ latestLottery: { pageNo, totalPage, totalSize, onNext, onPage, onPrev, list } }: ColorHistoryProps) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 8.875rem)' }}>
      <ResultTable
        className="rounded-none px-2 pb-2"
        th={
          <div className="flex flex-1 items-center mx-3 uppercase">
            <div className="flex-2 text-left">{t('common.label.table.issue')}</div>
            <div className="flex-1 text-center">{t('wingo.table.number')}</div>
            <div className="flex-1 text-right">{t('wingo.table.color')}</div>
          </div>
        }
        dataList={list}
        td={(item: ColorHistoryItem) => (
          <div className="flex flex-1 items-center mx-3 py-3">
            <div className="flex-2 text-left text-sm">{item.issueNo}</div>
            <div className={`flex-1 text-center wingo-result-history-text-${resultColorText(item.number)} text-sm`}>
              {item.number}
            </div>
            <div className="flex-1 flex justify-end gap-1">
              {resultColors(item.number).map((color) => (
                <div key={color} className={`w-4 h-4 wingo-result-history-${color} rounded-full`} />
              ))}
            </div>
          </div>
        )}
      />
      <Pagination
        onPrev={onPrev}
        onNext={onNext}
        onPage={onPage}
        totalPage={totalPage}
        totalSize={totalSize}
        pageNo={pageNo}
      />
    </div>
  )
}
