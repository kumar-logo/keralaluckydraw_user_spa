import { useTranslation } from 'react-i18next'
import { Button } from '@nextui-org/react'
import clsx from 'clsx'
import { ChevronIcon } from './ChevronIcon'

interface ShowMoreProps {
  showMore: boolean
  setShowMore?: (v: boolean) => void
  className?: string
  onClick?: () => void
}

export const ShowMore = ({ showMore, setShowMore, className, onClick }: ShowMoreProps) => {
  const { t } = useTranslation()
  return (
    <Button
      className={clsx('p-2 mx-0 rounded-sm bg-selected flex items-center justify-center border border-gray w-full gap-0', className)}
      onPress={() => {
        if (onClick) onClick(); else setShowMore?.(!showMore)
      }}
    >
      <p className={clsx('text-xs text-sec font-bold mr-2 uppercase')}>
        {t(showMore ? 'common.label.collapse' : 'common.label.showMore')}
      </p>
      <ChevronIcon
        className="size-4! text-sec-acc"
        style={{
          transition: '0.2s',
          transform: showMore ? 'rotate(270deg)' : 'rotate(90deg)',
        }}
      />
    </Button>
  )
}
