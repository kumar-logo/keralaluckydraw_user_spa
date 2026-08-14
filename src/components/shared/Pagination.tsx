import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pagination as NextUIPagination, Button } from '@nextui-org/react'
import { PaginationArrow } from './PaginationArrow'

interface PaginationProps {
  totalPage: number
  totalSize: number
  pageNo: number
  onPage: (page: number) => void
  onNext: () => void
  onPrev: () => void
  className?: string
}

export const Pagination = ({ totalPage, totalSize, pageNo, onPage, onNext, onPrev, className }: PaginationProps) => {
  const { t } = useTranslation()
  const isFirst = useMemo(() => pageNo <= 1, [pageNo])
  const isLast = useMemo(() => pageNo >= totalPage, [pageNo, totalPage])

  return totalSize > 0 ? (
    <div className={'w-full bg-white dark:bg-gray py-3 flex justify-center items-center gap-x-4' + (className ? ' ' + className : '')}>
      <p className="text-sm text-acc">
        {t('common.label.total')} {totalSize}
      </p>
      <NextUIPagination
        total={totalPage}
        page={pageNo}
        onChange={onPage}
        dotsJump={2}
        boundaries={0}
        classNames={{
          cursor: 'min-w-6 size-6 bg-transparent font-bold text-main',
          item: 'shadow-none bg-transparent text-sec min-w-6 size-6',
          wrapper: 'gap-0.5',
          base: 'p-0 m-0',
        }}
      />
      <div className="flex justify-center">
        <Button
          isIconOnly
          size="sm"
          className={`min-w-8 size-8 bg-selected border border-text-acc rounded-sm mr-2 data-[disabled=true]:opacity-40`}
          isDisabled={isFirst}
          onPress={onPrev}
        >
          <PaginationArrow />
        </Button>
        <Button
          isIconOnly
          size="sm"
          className={`min-w-8 size-8 bg-selected border border-text-acc rounded-sm data-[disabled=true]:opacity-40`}
          isDisabled={isLast}
          onPress={onNext}
        >
          <PaginationArrow left={false} />
        </Button>
      </div>
    </div>
  ) : null
}
