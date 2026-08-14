import { useState, useEffect, useMemo, useRef, createRef, RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@nextui-org/react'
import { formatCurrency } from '../../utils/format'
import { ColorBall } from '../four_five_digit/ColorBall'
import { CountInput } from '../shared/CountInput'
import { PlusIcon } from '../shared/PlusIcon'
import { usePositionConfig, resolvePositionColor } from '../../config/positionContext'

interface CountInputHandle {
  inputRef: RefObject<HTMLInputElement | null>
}

const usePositionColor = (letter: string): string => {
  const config = usePositionConfig()
  return resolvePositionColor(config, config.labels.indexOf(letter))
}

const LEVEL_NAMES: Record<number, string> = {
  1: 'single',
  2: 'double',
  3: 'triple',
  4: 'four',
  5: 'five',
}

const MinusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M3.33325 8H12.6666"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

interface RateInputProps {
  rate?: string
  disabled?: boolean
  onChangeRate?: (v: string) => void
  onStepChange?: (v: number) => void
  onFocusStateChange?: (focused: boolean) => void
}

const RateInput = ({
  rate = '1',
  disabled = true,
  onChangeRate = () => {},
  onStepChange = () => {},
  onFocusStateChange,
}: RateInputProps) => (
  <div className={`flex gap-x-1 ${disabled ? 'opacity-30' : 'opacity-100'}`}>
    <div
      className="h-8 w-7 rounded-sm bg-selected flex items-center justify-center"
      onClick={() => {
        if (rate) {
          const newRate = Number(rate) - 1
          onStepChange(newRate)
        }
      }}
    >
      <MinusIcon />
    </div>
    <CountInput
      value={rate}
      maxLength={3}
      onFocusBlur={onFocusStateChange}
      onChange={onChangeRate}
      className="h-8 bg-transparent! w-16"
      inputWrapClassName="p-0 rounded-none min-h-0 !bg-transparent"
    />
    <div
      className="h-8 w-7 rounded-sm bg-selected flex items-center justify-center"
      onClick={() => {
        if (rate) {
          const newRate = Number(rate) + 1
          onStepChange(newRate)
        }
      }}
    >
      <PlusIcon />
    </div>
  </div>
)

interface SectionHeaderProps {
  level?: number
  title?: string
  winPrize?: number
  payment?: number
  onGuess?: () => void
  discount?: boolean
  canBetting?: boolean
}

const SectionHeader = ({
  level = 1,
  title,
  winPrize = 0,
  payment = 0,
  onGuess = () => {},
  discount,
  canBetting = true,
}: SectionHeaderProps) => {
  const name = useMemo(() => (level ? LEVEL_NAMES[level] : ''), [level])
  const { i18n } = useTranslation()

  return (
    <div className="flex items-center">
      <div className="flex flex-col flex-1">
        <div className="flex gap-x-1">
          <p className="text-sm text-main font-bold">
            {title ||
              `${i18n.t(`common.label.games.${name}`)} ${i18n.t('common.label.digit')}`}
          </p>
          <div className="flex items-center font-bold din text-main rounded-sm bg-linear-to-r from-[#C7DAF5] to-white dark:from-[#647068] dark:to-gray px-1">
            <p className="text-10 mr-1 capitalize">
              {i18n.t('common.label.win')}
            </p>
            <p className="text-xs">{formatCurrency(winPrize)}</p>
          </div>
        </div>
        {discount ? (
          <div className="flex items-center text-xs mt-1 text-main">
            <p className="text-xs font-bold line-through text-sec">
              {formatCurrency(payment)}
            </p>
            <p className="text-xs font-bold ml-1">
              {formatCurrency(payment * (discount ? 0 : 1))}
            </p>
          </div>
        ) : (
          <p className="text-xs font-bold mt-1 text-main">{formatCurrency(payment)}</p>
        )}
      </div>
      <Button
        isDisabled={!canBetting}
        className="uppercase rounded-sm min-h-0 bg-selected text-sec text-sm font-bold min-w-0 p-2 h-8"
        onPress={onGuess}
      >
        {i18n.t('common.label.random')}
      </Button>
    </div>
  )
}

interface SingleInputProps {
  digit?: string
  color?: string
  onAdd?: (type: string, value: string, count: number, target?: Element | null) => void
  guessNum?: string
  extend?: number
  isLast?: boolean
  canBetting?: boolean
}

const SingleInput = ({
  color = 'A',
  onAdd = () => {},
  guessNum = '',
  extend = 0,
  isLast = false,
  canBetting = true,
}: SingleInputProps) => {
  const [value, setValue] = useState('')
  const [rate, setRate] = useState('0')
  const [focused, setFocused] = useState(false)
  const { i18n } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const circleColor = usePositionColor(color)

  useEffect(() => {
    setValue(guessNum)
  }, [extend, guessNum])

  useEffect(() => {
    setRate(value ? '1' : '0')
  }, [value])

  useEffect(() => {
    if (!focused && (!rate || Number(rate) <= 0)) setValue('')
  }, [rate, focused])

  return (
    <div className={`flex justify-between ${isLast ? '' : 'pb-2 border-b border-b-gray'}`}>
      <div className="flex items-center gap-2">
        <div ref={ref}>
          <ColorBall color={color} />
        </div>
        <CountInput
          includeZero
          isDisabled={!canBetting}
          value={value}
          maxLength={1}
          onChange={setValue}
          placeholder="-"
          digitCircle
          circleColor={circleColor}
        />
      </div>
      <div className="flex items-center gap-3">
        <RateInput
          disabled={!canBetting || (!focused && !value)}
          rate={rate}
          onChangeRate={(b) => setRate(b)}
          onStepChange={(b) => setRate(`${b}`)}
          onFocusStateChange={setFocused}
        />
        <Button
          isDisabled={!canBetting || !value}
          onPress={() => {
            onAdd(color, value, Number(rate), ref.current)
            setTimeout(() => {
              setFocused(false)
              setValue('')
            })
          }}
          className="uppercase rounded-sm min-h-0 bg-primary text-black text-sm font-bold min-w-0 p-0 w-[3.75rem] h-8"
        >
          {i18n.t('common.label.games.add')}
        </Button>
      </div>
    </div>
  )
}

interface DoubleInputProps {
  digits?: string[]
  guessNums?: string[]
  onAdd?: (type: string, value: string, count: number, target?: Element | null) => void
  extend?: number
  isLast?: boolean
  canBetting?: boolean
}

const DoubleInput = ({
  digits = [],
  guessNums = [],
  onAdd = () => {},
  extend = 0,
  isLast,
  canBetting = true,
}: DoubleInputProps) => {
  const [values, setValues] = useState<string[]>([])
  const refs = useRef([createRef<CountInputHandle>(), createRef<CountInputHandle>()])
  const [rate, setRate] = useState('0')
  const [focused, setFocused] = useState(false)
  const { i18n } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const positionConfig = usePositionConfig()

  useEffect(() => {
    if (guessNums && guessNums.filter((v) => v).length === 2)
      setValues(guessNums)
  }, [guessNums, extend])

  const isValid = useMemo(
    () => values.filter((y) => y).length === 2 || focused,
    [values, focused]
  )

  useEffect(() => {
    setRate(isValid ? '1' : '0')
  }, [isValid])

  useEffect(() => {
    if (!focused && (!rate || Number(rate) <= 0)) setValues([])
  }, [rate, focused])

  const handleChange = (idx: number, val: string) => {
    if (idx < 1 && val) {
      const next = refs.current[idx + 1]?.current
      if (next) next.inputRef?.current?.focus()
    }
    const newValues = [...values]
    newValues[idx] = val
    setValues(newValues)
  }

  return (
    <div className={`flex justify-between ${isLast ? '' : 'pb-2 border-b border-b-gray'}`}>
      <div className="flex gap-2" ref={containerRef}>
        {digits.map((d, digitIdx) => {
          const color = resolvePositionColor(positionConfig, positionConfig.labels.indexOf(d))
          return (
          <div key={digitIdx} className="flex flex-col items-center gap-2">
            <ColorBall color={d} />
            <CountInput
              includeZero
              isDisabled={!canBetting}
              ref={refs.current[digitIdx]}
              value={values[digitIdx] || ''}
              maxLength={1}
              placeholder="-"
              digitCircle
              circleColor={color}
              onChange={(val: string) => handleChange(digitIdx, val)}
            />
          </div>
          )
        })}
      </div>
      <div className="flex flex-col gap-y-2">
        <RateInput
          onFocusStateChange={setFocused}
          rate={rate}
          disabled={!canBetting || !isValid}
          onChangeRate={(v) => setRate(v)}
          onStepChange={(v) => setRate(`${v}`)}
        />
        <Button
          isDisabled={!canBetting || !isValid}
          onPress={() => {
            onAdd(digits.join(''), values.join(''), Number(rate), containerRef.current)
            setTimeout(() => {
              setFocused(false)
              setValues([])
            })
          }}
          className="uppercase rounded-sm min-h-0 bg-primary text-black text-sm font-bold min-w-0 p-0 w-full h-8"
        >
          {i18n.t('common.label.games.add')}
        </Button>
      </div>
    </div>
  )
}

interface MultiInputProps {
  digits?: string[]
  guessNums?: string[]
  onAdd?: (type: string, value: string, count: number, target?: Element | null) => void
  onBox?: (value: string, count: number, target?: Element | null) => void
  extend?: number
  canBetting?: boolean
}

const MultiInput = ({
  digits = [],
  guessNums = [],
  onAdd = () => {},
  onBox = () => {},
  extend = 0,
  canBetting = true,
}: MultiInputProps) => {
  const [values, setValues] = useState<string[]>([])
  const [rate, setRate] = useState('0')
  const [focused, setFocused] = useState(false)
  const inputRefs = useRef(
    Array.from({ length: 5 }, () => createRef<CountInputHandle>())
  )
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const positionConfig = usePositionConfig()

  useEffect(() => {
    if (guessNums && guessNums.filter((v) => v).length === digits.length)
      setValues(guessNums)
  }, [extend, guessNums])

  const handleChange = (idx: number, val: string) => {
    const next = inputRefs.current[idx + 1]?.current
    if (next) next.inputRef?.current?.focus()
    const newValues = [...values]
    newValues[idx] = val
    setValues(newValues)
  }

  const isValid = useMemo(
    () => values.filter((y) => y).length === digits.length || focused,
    [values, focused]
  )

  useEffect(() => {
    setRate(isValid ? '1' : '0')
  }, [isValid])

  useEffect(() => {
    if (!focused && (!rate || Number(rate) <= 0)) setValues([])
  }, [rate, focused])

  return (
    <div className="flex justify-between">
      <div className="flex" ref={containerRef}>
        {digits.map((d, digitIdx) => {
          const color = resolvePositionColor(positionConfig, positionConfig.labels.indexOf(d))
          return (
          <div key={digitIdx} className="flex flex-col items-center gap-2 mr-2">
            <ColorBall color={d} />
            <CountInput
              includeZero
              isDisabled={!canBetting}
              ref={inputRefs.current[digitIdx]}
              value={values[digitIdx] || ''}
              maxLength={1}
              placeholder="-"
              digitCircle
              circleColor={color}
              circleSize={digits.length > 3 ? 44 : 54}
              onChange={(val: string) => handleChange(digitIdx, val)}
            />
          </div>
          )
        })}
      </div>
      <div className="flex flex-col">
        <RateInput
          disabled={!canBetting || !isValid}
          onFocusStateChange={setFocused}
          rate={rate}
          onChangeRate={(v) => setRate(v)}
          onStepChange={(v) => setRate(`${v}`)}
        />
        <div className="flex mt-2 items-center">
          <Button
            onPress={() => {
              onBox(values.join(''), Number(rate), containerRef.current)
              setTimeout(() => {
                setFocused(false)
                setValues([])
              })
            }}
            isDisabled={!canBetting || !isValid}
            className="uppercase rounded-sm min-h-0 bg-primary text-black text-sm font-bold min-w-0 p-0 flex-1 h-8 mr-2"
          >
            {t('common.label.games.box')}
          </Button>
          <Button
            onPress={() => {
              onAdd(digits.join(''), values.join(''), Number(rate), containerRef.current)
              setTimeout(() => {
                setFocused(false)
                setValues([])
              })
            }}
            isDisabled={!canBetting || !isValid}
            className="uppercase rounded-sm min-h-0 bg-primary text-black text-sm font-bold flex-1 min-w-0 p-0 h-8"
          >
            {t('common.label.games.add')}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ThreeDigitBettingPanelProps {
  level?: number
  title?: string
  groups?: (string | string[])[]
  winPrize?: number
  payment?: number
  onAdd?: (type: string, value: string, count: number, target?: Element | null) => void
  handleBox?: (value: string, count: number, target?: Element | null) => void
  discount?: boolean
  canBetting?: boolean
}

export const ThreeDigitBettingPanel = ({
  level = 1,
  title,
  groups: groupsProp,
  winPrize,
  payment,
  onAdd = () => {},
  handleBox = () => {},
  discount,
  canBetting = true,
}: ThreeDigitBettingPanelProps) => {
  const [singleGuesses, setSingleGuesses] = useState<string[]>([])
  const [doubleGuesses, setDoubleGuesses] = useState<string[][]>([[]])
  const [tripleGuesses, setTripleGuesses] = useState<string[][]>([[]])
  const [singleExtend, setSingleExtend] = useState(0)
  const [doubleExtend, setDoubleExtend] = useState(0)
  const [tripleExtend, setTripleExtend] = useState(0)

  const groups = useMemo(
    () =>
      groupsProp ??
      (level === 1
        ? ['A', 'B', 'C']
        : level === 2
          ? [['A', 'B'], ['A', 'C'], ['B', 'C']]
          : level === 3
            ? [['A', 'B', 'C']]
            : level === 4
              ? [['A', 'B', 'C', 'D']]
              : level === 5
                ? [['A', 'B', 'C', 'D', 'E']]
                : []),
    [level, groupsProp]
  )

  const randomize = () => {
    if (level === 1) {
      const randomDigits = new Array(3).fill('').map(() => `${Math.floor(Math.random() * 10)}`)
      setSingleGuesses(randomDigits)
    } else if (level === 2) {
      const randomDigits = new Array(3)
        .fill(new Array(2).fill(''))
        .map((c) => c.map(() => `${Math.floor(Math.random() * 10)}`))
      setDoubleGuesses(randomDigits)
    } else if (level >= 3) {
      const randomDigits = new Array(1)
        .fill(new Array(level).fill(''))
        .map((c) => c.map(() => `${Math.floor(Math.random() * 10)}`))
      setTripleGuesses(randomDigits)
    }
  }

  useEffect(() => {
    setSingleExtend((p) => p + 1)
  }, [singleGuesses])

  useEffect(() => {
    setDoubleExtend((b) => b + 1)
  }, [doubleGuesses])

  useEffect(() => {
    setTripleExtend((v) => v + 1)
  }, [tripleGuesses])

  return (
    <div className="p-3 bg-white dark:bg-gray rounded-lg flex flex-col gap-3">
      <SectionHeader
        discount={discount}
        title={title}
        winPrize={winPrize}
        payment={payment}
        level={level}
        onGuess={randomize}
        canBetting={canBetting}
      />
      {groups.map((k, C) =>
        level === 1 ? (
          <SingleInput
            key={C}
            onAdd={onAdd}
            isLast={C === groups.length - 1}
            guessNum={singleGuesses[C]}
            color={k as string}
            digit={k as string}
            extend={singleExtend}
            canBetting={canBetting}
          />
        ) : level === 2 ? (
          <DoubleInput
            key={C}
            onAdd={onAdd}
            isLast={C === groups.length - 1}
            guessNums={doubleGuesses[C]}
            extend={doubleExtend}
            digits={k as string[]}
            canBetting={canBetting}
          />
        ) : (
          <MultiInput
            key={C}
            onAdd={onAdd}
            onBox={handleBox}
            guessNums={tripleGuesses[C]}
            digits={k as string[]}
            extend={tripleExtend}
            canBetting={canBetting}
          />
        )
      )}
    </div>
  )
}
