import { useRef, useEffect } from 'react'
import { Tabs, Tab } from '@nextui-org/react'
import clsx from 'clsx'

interface TabOption {
  title: React.ReactNode
  key: string
  render?: React.ReactNode
}

interface TabListProps {
  classNameBase?: string
  fitTabContent?: boolean
  tabOptions: TabOption[]
  classNameCursor?: string
  classNameTabList?: string
  classNameTabContent?: string
  classNamePanel?: string
  classNameTab?: string
  selectedKey: string
  onSelectionChange: (key: any) => void
  disableCursorAnimation?: boolean
}

export const TabList = ({
  classNameBase,
  fitTabContent = true,
  tabOptions,
  classNameCursor,
  classNameTabList,
  classNameTabContent,
  classNamePanel,
  classNameTab,
  selectedKey,
  onSelectionChange,
  disableCursorAnimation,
}: TabListProps) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const selected = ref.current.querySelector('button[aria-selected="true"]') as HTMLElement
    if (!selected) return
    const containerWidth = ref.current.clientWidth
    const offsetL = selected.offsetLeft
    const elWidth = selected.clientWidth
    if (offsetL > containerWidth + ref.current.scrollLeft || offsetL + elWidth < ref.current.scrollLeft) {
      ref.current.scrollTo({ left: offsetL, behavior: 'smooth' })
    }
  }, [selectedKey])

  return (
    <Tabs
      disableCursorAnimation={disableCursorAnimation}
      ref={ref}
      aria-label="Options"
      color="primary"
      variant="underlined"
      classNames={{
        base: clsx('w-full flex flex-col justify-end px-3 h-10 min-h-10 bg-white dark:bg-selected z-10', classNameBase),
        tabList: clsx('gap-6 w-full h-full flex items-center relative rounded-none p-0 border-divider overflow-auto', fitTabContent && 'items-between overflow-x-visible', classNameTabList),
        tab: clsx(fitTabContent && 'max-w-fit', 'px-0 h-full', classNameTab),
        cursor: clsx('w-5 bg-main h-0.5', classNameCursor),
        tabContent: clsx('group-data-[selected=true]:text-main group-data-[selected=true]:font-bold text-sec', classNameTabContent),
        panel: classNamePanel,
      }}
      selectedKey={selectedKey}
      onSelectionChange={onSelectionChange}
    >
      {tabOptions.map((opt) => (
        <Tab key={opt.key} title={opt.title}>
          {opt.render}
        </Tab>
      ))}
    </Tabs>
  )
}
