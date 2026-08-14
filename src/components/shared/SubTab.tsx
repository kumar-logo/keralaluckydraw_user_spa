import { useState, useEffect } from 'react'
import clsx from 'clsx'

interface SubTabOption {
  label: React.ReactNode
  value: string
}

interface SubTabProps {
  tabs: SubTabOption[]
  value?: string
  onChange: (value: string) => void
}

export const SubTab = ({ tabs, value, onChange }: SubTabProps) => {
  const [selected, setSelected] = useState(value)

  useEffect(() => {
    setSelected(value)
  }, [value])

  return (
    <div className="flex items-center w-full gap-2 overflow-auto">
      {tabs.map((tab, idx) => (
        <div
          key={idx}
          className={clsx(
            'bg-white dark:bg-selected flex-1 min-w-[20%] text-center p-2 rounded',
            tab.value === selected && 'border-t-3 border-primary pt-1.5'
          )}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </div>
      ))}
    </div>
  )
}
