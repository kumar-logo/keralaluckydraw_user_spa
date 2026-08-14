import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import clsx from 'clsx'
import { BottomSheetSelect } from '../shared/BottomSheetSelect'
import type { RaceTabDto } from '../../services/raceApi'

const DropdownArrow = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    className={clsx('size-3 text-sec', className)}
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M7.2 8.9C6.6 9.7 5.4 9.7 4.8 8.9L1.8 4.9C1.05836 3.91115 1.76393 2.5 3 2.5L9 2.5C10.2361 2.5 10.9416 3.91115 10.2 4.9L7.2 8.9Z"
      fill="currentColor"
    />
  </svg>
)

interface GameModeOption extends RaceTabDto {
  label: string
}

interface GameModeSelectorProps {
  count: number
  value: number
  onValueChange: (item: RaceTabDto) => void
  tabs?: RaceTabDto[]
}

export const GameModeSelector = ({ count, value, onValueChange, tabs }: GameModeSelectorProps) => {
  const { t } = useTranslation()

  const list = useMemo<GameModeOption[]>(
    () =>
      tabs?.length
        ? tabs.map((c) => ({
            ...c,
            label: c.count + ' ' + i18n.t('common.label.players'),
          }))
        : [],
    [tabs]
  )

  const displayText = useMemo(
    () =>
      list.length
        ? ((list.find((c) => c.id === value) ?? list[0]).count + '' + t('common.label.players'))
        : count + '' + t('common.label.players'),
    [list, t, value, count]
  )

  return (
    <BottomSheetSelect
      value={value}
      onValueDetailChange={(c) => onValueChange(c)}
      valueKey="id"
      list={list}
    >
      <div className="flex items-center">
        <span className="text-black mr-1">Run &amp; Guess ({displayText})</span>
        <DropdownArrow className="text-black!" />
      </div>
    </BottomSheetSelect>
  )
}
