import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { ScrollableTabs } from './ScrollableTabs'

interface GameTimeTabsProps {
  tabOptions: { title: React.ReactNode; key: string }[]
  selectedKey: string
  showMin?: boolean
  onSelectionChange?: (key: string) => void
  itemClassName?: string
  isRow?: boolean
  className?: string
  tabItemWrapClassName?: string
  tabItemActiveClassName?: string
}

export const GameTimeTabs = ({
  tabOptions,
  selectedKey,
  showMin = false,
  onSelectionChange,
  itemClassName = '',
  isRow = false,
  className = '',
  tabItemWrapClassName = '',
  tabItemActiveClassName = '',
}: GameTimeTabsProps) => {
  const { t } = useTranslation()

  const options = useMemo(
    () =>
      tabOptions.map((opt) => ({
        key: opt.key,
        render: (
          <div className={clsx('flex items-center font-bold din', isRow ? 'justify-center gap-1.5' : 'flex-col')}>
            <div className="text-xs text-sec flex items-center">
              <span className="text-xl">{opt.title}</span>
              {showMin && (
                <span className="text-sec text-xs ml-2 capitalize">
                  {t('common.label.games.minutes')}
                </span>
              )}
            </div>
          </div>
        ),
      })),
    [showMin, tabOptions, isRow, t]
  )

  return (
    <ScrollableTabs
      tabOptions={options}
      activeKey={selectedKey || ''}
      onTabChange={onSelectionChange}
      hideIndicator
      tabItemWrapClassName={tabItemWrapClassName}
      tabItemClassName={clsx(
        'bg-light-gray dark:bg-selected rounded h-10 flex-1 flex items-center px-2 justify-center text-acc',
        itemClassName
      )}
      tabItemActiveClassName={clsx('bg-primary! **:text-black!', tabItemActiveClassName)}
      className={clsx('bg-white dark:bg-gray', className)}
      shadowWidth={0}
    />
  )
}
