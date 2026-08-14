import { useTranslation } from 'react-i18next'
import { Badge } from '@nextui-org/react'
import clsx from 'clsx'
import { TabList } from './TabList'
import { checkAuth } from '../../utils/helpers'

interface GameTabSelectorProps {
  value: string
  className?: string
  setValue: (v: any) => void
  orderNum: number
  setOrderNum: (v: number) => void
}

export const GameTabSelector = ({ value, className, setValue, orderNum, setOrderNum }: GameTabSelectorProps) => {
  const { t } = useTranslation()

  return (
    <TabList
      classNameBase={clsx('bg-white dark:bg-gray border-t border-selected flex h-10', className)}
      classNameCursor="bg-primary h-0.5!"
      classNameTab="h-full"
      fitTabContent={false}
      tabOptions={[
        {
          title: t('common.label.resultHistory'),
          key: 'history',
        },
        {
          title: orderNum ? (
            <Badge
              color="primary"
              className="text-black! text-[10px]! border-none! size-3! min-h-auto! min-w-auto!"
              content={orderNum}
            >
              {t('common.label.games.myOrder')}
            </Badge>
          ) : (
            t('common.label.games.myOrder')
          ),
          key: 'order',
        },
      ]}
      selectedKey={value}
      onSelectionChange={(key) => {
        setValue(key)
        if (key === 'order' && checkAuth()) setOrderNum(0)
      }}
    />
  )
}
