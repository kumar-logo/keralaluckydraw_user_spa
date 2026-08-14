import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollableTabs } from '../shared/ScrollableTabs'

interface ResultCycleTabsProps {
  tabOptions: { title: React.ReactNode; key: string }[]
  selectedKey: string
  onSelectionChange?: (key: string) => void
}

export const ResultCycleTabs = ({ tabOptions, selectedKey, onSelectionChange }: ResultCycleTabsProps) => {
  const { t } = useTranslation()

  const options = useMemo(
    () =>
      tabOptions.map((opt) => ({
        key: opt.key,
        render: (
          <div className="flex items-center font-bold din text-sm">
            <div className="text-xl text-main">{opt.title}</div>
            <div className="text-xs text-acc ml-2">{t('result.minute')}</div>
          </div>
        ),
      })),
    [t, tabOptions]
  )

  return (
    <ScrollableTabs
      tabOptions={options}
      activeKey={selectedKey}
      onTabChange={onSelectionChange}
      className="bg-transparent px-0!"
      tabItemWrapClassName=""
      tabItemClassName="result-cycle-tabs-tab h-8 px-0 bg-white dark:bg-gray rounded-sm flex min-w-20 justify-center"
      tabItemActiveClassName="result-cycle-tabs-tab-selected bg-[#D8E3E8]"
    />
  )
}
