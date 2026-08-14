import { useTranslation } from 'react-i18next'
import { Button } from '@nextui-org/react'
import { resolveAssetUrl } from '../../utils/helpers'
import { Spin } from '../shared/Spin'
import { ResultRowCard } from './ResultRowCard'
import { useDigitPositionConfigStore, gameIdFromDrawNo } from '../../stores/digitPositionConfigStore'

export interface DigitHistoryRow {
  drawNo: string
  result: string
  drawTime: string
  gameName: string
  icon?: string
}

interface DigitHistoryListProps {
  rows: DigitHistoryRow[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  onLoadMore?: () => void
  onRowPress: (row: DigitHistoryRow) => void
  // Only relevant for paginated lists: render the "No more data" end marker
  // once the list has actually spanned more than one page. A single page of
  // results (or a non-paginated list) ends with no marker.
  showEndMarker?: boolean
}

export const DigitHistoryList = ({
  rows,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  onRowPress,
  showEndMarker = false,
}: DigitHistoryListProps) => {
  const { t } = useTranslation()
  const configs = useDigitPositionConfigStore((s) => s.configs)
  const isEmpty = !loading && rows.length === 0

  return (
    <Spin loading={loading} className="overflow-y-auto flex-1 flex-col overflow-hidden p-2 pb-16 *:mb-2">
      {rows.map((row, idx) => {
        const entry = configs[gameIdFromDrawNo(row.drawNo)] ?? { colors: [], labels: [] }
        return (
          <ResultRowCard
            key={`${row.drawNo}-${idx}`}
            icon={resolveAssetUrl(row.icon)}
            gameName={row.gameName}
            result={row.result}
            drawTime={row.drawTime}
            colors={entry.colors}
            labels={entry.labels}
            onPress={() => onRowPress(row)}
          />
        )
      })}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 text-acc">
          <svg className="size-16 mb-4 opacity-30" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6H4V4h16v2zm-2 6H6V10h12v2zm-4 6H10v-2h4v2z" />
          </svg>
          <p className="text-sm">{t('common.label.noData')}</p>
        </div>
      ) : null}

      {!loading && rows.length > 0 ? (
        hasMore && onLoadMore ? (
          <Button
            onPress={onLoadMore}
            isLoading={loadingMore}
            className="bg-white dark:bg-gray text-main text-sm font-bold rounded-sm w-full"
          >
            {t('common.label.loadMore')}
          </Button>
        ) : showEndMarker ? (
          <p className="text-center text-xs text-sec py-3">{t('common.label.noMoreData')}</p>
        ) : null
      ) : null}
    </Spin>
  )
}
