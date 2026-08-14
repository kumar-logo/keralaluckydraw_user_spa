import { useMemo, ComponentProps } from 'react'
import { Button, Input } from '@nextui-org/react'
import clsx from 'clsx'
import { PlusIcon } from '../shared/PlusIcon'

type InputPassthrough = Omit<
  ComponentProps<typeof Input>,
  'max' | 'min' | 'value' | 'onValueChange' | 'classNames' | 'className'
>

const MinusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.33325 8H12.6666"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

interface FourFiveDigitCountInputProps extends InputPassthrough {
  max?: number
  min?: number
  value?: string
  onValueChange?: (v: string) => void
  classNames?: Record<string, string>
  containerProps?: React.HTMLAttributes<HTMLDivElement>
  className?: string
}

export const FourFiveDigitCountInput = ({
  max = Infinity,
  min = 0,
  value,
  onValueChange,
  classNames: cn,
  containerProps: { className: containerClassName, ...containerRest } = {},
  ...rest
}: FourFiveDigitCountInputProps) => {
  const [isMin, isMax] = useMemo(() => {
    if (value == null) return [false, false]
    const parsed = parseInt(value)
    return [
      typeof min === 'number' ? parsed <= min : false,
      typeof min === 'number' ? parsed >= max : false,
    ]
  }, [max, min, value])

  const { base: baseSlot, input: inputSlot, inputWrapper: wrapperSlot, ...otherSlots } = useMemo(
    () => cn ?? {},
    [cn]
  )

  return (
    <div
      className={clsx('flex items-center', containerClassName)}
      {...containerRest}
    >
      <Button
        isIconOnly
        className="min-w-0 px-2 h-full w-auto aspect-square bg-selected rounded-sm text-sec disabled:opacity-30"
        onPress={() => {
          const parsed = parseInt(value ?? '0')
          if (typeof min === 'number' && parsed > min) {
            onValueChange?.(parsed - 1 + '')
          }
        }}
        isDisabled={isMin}
      >
        <MinusIcon />
      </Button>
      <Input
        max={max}
        min={min}
        classNames={{
          base: clsx('mx-1 h-full', baseSlot),
          input: clsx(
            'h-full text-main text-sm font-bold text-center',
            inputSlot
          ),
          inputWrapper: clsx(
            'h-full min-h-0! rounded-sm bg-selected shadow-none border border-text-main/40',
            wrapperSlot
          ),
          ...otherSlots,
        }}
        value={value}
        onValueChange={onValueChange}
        {...rest}
      />
      <Button
        isIconOnly
        className="min-w-0! px-2 h-full w-auto aspect-square bg-selected rounded-sm text-sec disabled:opacity-30"
        onPress={() => {
          const parsed = parseInt(value ?? '0')
          if (typeof min === 'number' && parsed < max) {
            onValueChange?.(parsed + 1 + '')
          }
        }}
        isDisabled={isMax}
      >
        <PlusIcon />
      </Button>
    </div>
  )
}
