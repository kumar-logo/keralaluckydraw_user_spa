import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Image } from '@nextui-org/react'
import clsx from 'clsx'
import { formatCurrency } from '../../utils/format'
import { DubaiGameInfo } from '../../services/dubaiApi'
import { DubaiNumberIcon, RandomIcon } from './DubaiIcons'
import { NumericInput } from '../shared/NumericInput'
import { RulesIcon } from '../shared/RulesIcon'
import { DeleteIcon } from '../shared/DeleteIcon'

const MULTIPLIER_PRESETS = ['1', '5', '10', '20']

interface MultiplierSelectorProps {
  gameInfo?: DubaiGameInfo
  multiple: string
  setMultiple: (v: string) => void
  className?: string
  betNumber?: number
}

export const dubaiOddsFor = (gameInfo?: DubaiGameInfo, betNumber?: number): number => {
  const perNumber =
    betNumber != null ? gameInfo?.numberOdds?.[String(betNumber)] : undefined
  const odds = perNumber ?? gameInfo?.payRate ?? 0
  return Number(odds) || 0
}

const MultiplierSelector = ({
  gameInfo,
  multiple,
  setMultiple,
  className,
  betNumber,
}: MultiplierSelectorProps) => {
  const { t } = useTranslation()
  const isCustom = useMemo(() => MULTIPLIER_PRESETS.indexOf(multiple) === -1, [multiple])
  const oddsValue = dubaiOddsFor(gameInfo, betNumber)

  return (
    <div className={clsx('bg-light-gray dark:bg-selected rounded', className)}>

      <div className="flex items-center mb-2">
        <div className="grid grid-cols-4 gap-x-2">
          {MULTIPLIER_PRESETS.map((preset) => (
            <Button
              key={preset}
              className={
                'w-10 h-6 rounded-sm text-xs font-bold border ' +
                (preset === multiple
                  ? 'text-white border-(--dubai-theme-color) bg-(--dubai-theme-color)'
                  : 'text-main border-text-acc bg-transparent')
              }
              onPress={() => setMultiple(preset)}
            >
              {'×'}{preset}
            </Button>
          ))}
        </div>
        <NumericInput
          startContent={<p className="text-xs">{'×'}</p>}
          max={2000}
          min={1}
          value={multiple}
          onValueChange={(v: string) => setMultiple(v)}
          placeholder={t('dubai.label.maxMultiple')}
          classNames={{
            base:
              'w-auto flex-1 ml-2 text-main font-bold border-text-acc border rounded-sm ' +
              (isCustom ? ' border-transparent bg-(--dubai-theme-color) text-main' : ''),
            inputWrapper: 'shadow-none h-6 min-h-0 px-2',
            input: 'text-xs pl-2',
          }}
        />
      </div>

      <div className="flex items-center">
        <div className="flex-1 text-center">
          <p className="font-black text-main">
            {formatCurrency((gameInfo?.price || 0) * parseInt(multiple), 0)}
          </p>
          <p className="text-10 capitalize">{t('common.label.pay')}</p>
        </div>
        <div className="mx-2 w-px h-4 bg-text-sec" />
        <div className="flex-1 text-center text-(--dubai-theme-color)">
          <p className="font-black">
            {formatCurrency(
              (gameInfo?.price || 0) * parseInt(multiple) * oddsValue,
              0
            )}
          </p>
          <p className="text-10 capitalize">{t('common.label.win')}</p>
        </div>
      </div>
    </div>
  )
}

interface RulesButtonProps {
  onRule: () => void
}

const RulesButton = ({ onRule }: RulesButtonProps) => {
  const { t } = useTranslation()

  return (
    <Button
      className="rounded-xl border border-acc p-1 pr-2 h-6 w-auto text-xs gap-0"
      onPress={onRule}
    >
      <div className="rounded-full bg-text-sec flex justify-center items-center p-[0.5px] mr-2">
        <RulesIcon className="size-3.5 text-light-gray" />
      </div>
      {t('common.label.games.rules')}
    </Button>
  )
}

interface BetItem {
  number: number
  multiple: number
}

interface DubaiBettingProps {
  gameInfo?: DubaiGameInfo
  selected: (event: { target: Element }, item: BetItem) => void
  betList: BetItem[]
  canBetting: boolean
  onRule: () => void
}

interface DubaiBetSlipItemProps {
  gameInfo?: DubaiGameInfo
  item: BetItem
  updateMutiple: (v: number) => void
  onDelete: () => void
}

export const DubaiBetSlipItem = ({
  gameInfo,
  item,
  updateMutiple,
  onDelete,
}: DubaiBetSlipItemProps) => {
  const [multiple, setMultiple] = useState(`${item.multiple}`)

  useEffect(() => {
    updateMutiple(parseInt(multiple))
  }, [multiple])

  return (
    <div className="rounded-xl bg-light-gray p-3 mt-2 first:mt-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-(--dubai-theme-color)">
          <DubaiNumberIcon number={item.number} className="size-7" />
          <span className="text-main ml-2 font-bold">{item.number}</span>
        </div>
        <DeleteIcon onClick={onDelete} />
      </div>
      <MultiplierSelector
        className="mt-2 p-2"
        multiple={multiple}
        gameInfo={gameInfo}
        setMultiple={setMultiple}
        betNumber={item.number}
      />
    </div>
  )
}

export const DubaiBetting = ({ gameInfo, selected, betList, canBetting, onRule }: DubaiBettingProps) => {
  const { t } = useTranslation()
  const [multiple, setMultiple] = useState('1')

  const numbers = useMemo(() => {
    const min = Number(gameInfo?.numberMin)
    const max = Number(gameInfo?.numberMax)
    const lo = Number.isInteger(min) && min >= 1 ? min : 1
    const hi = Number.isInteger(max) && max >= lo ? max : 36
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
  }, [gameInfo?.numberMin, gameInfo?.numberMax])

  const selectedMap = useMemo(
    () =>
      betList.reduce<Record<number, boolean>>((acc, item) => {
        acc[item.number] = true
        return acc
      }, {}),
    [betList]
  )

  const iconRefs = useRef<(HTMLButtonElement | null)[]>([])

  return (
    <div className="p-2 flex flex-col">

      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-bold uppercase mb-2 leading-4">
            {t('dubai.tip.info.pencilEntry', { price: formatCurrency(Number(gameInfo?.price), 0) })}
          </p>
          <Image
            src="/images/dubai/pencil.webp"
            className="h-2"
            radius="none"
          />
        </div>
        <RulesButton onRule={onRule} />
      </div>

      <div className="rounded bg-white dark:bg-gray mt-2">

        <div className="flex items-center justify-between rounded-t bg-linear-to-b from-[#FFE5F7] dark:from-[#4C494B] to-white dark:to-gray px-3 py-2">
          <div>
            <p className="text-sm text-main font-bold mb-1 leading-4">
              {t('dubai.label.pick')}
            </p>
            <p className="text-10 text-sec">
              {t('dubai.tip.info.onlyOneCanSel')}
            </p>
          </div>
          <Button
            isDisabled={!canBetting}
            className="bg-transparent border border-text-sec rounded-sm h-8 px-3 text-xs font-bold gap-1"
            onPress={() => {
              const available = iconRefs.current?.filter(
                (_el, idx) =>
                  numbers[idx] != null &&
                  betList.findIndex((b) => b.number === numbers[idx]) === -1
              )
              if (available && available.length > 0) {
                const randomEl = available[Math.floor(Math.random() * available.length)]
                randomEl?.click()
              }
            }}
          >
            <RandomIcon />
            {t('common.label.random')}
          </Button>
        </div>

        <div className="grid grid-cols-6 gap-2 p-3 text-(--dubai-theme-color)">
          {numbers.map((num, index) => (
            <Button
              key={num}
              isDisabled={!canBetting}
              className={clsx(
                'flex flex-col w-auto h-auto items-center rounded-lg border border-selected py-1 gap-0 bg-transparent text-(--dubai-theme-color)',
                selectedMap[num] && 'bg-(--dubai-theme-color)! text-white!'
              )}
              ref={(el) => {
                iconRefs.current[index] = el
              }}
              onPress={(e) => {
                selected(e, {
                  number: num,
                  multiple: parseInt(multiple),
                })
              }}
            >
              <DubaiNumberIcon number={num} className="size-7" />
              <span
                className={clsx(
                  'text-xs text-main font-bold mt-1 delay-200',
                  selectedMap[num] && 'text-white'
                )}
              >
                {num}
              </span>
            </Button>
          ))}
        </div>

        <MultiplierSelector
          className="mx-2 mb-2 p-2"
          multiple={multiple}
          setMultiple={setMultiple}
          gameInfo={gameInfo}
        />
      </div>
    </div>
  )
}
