import { useState, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '@nextui-org/react'
import clsx from 'clsx'
import { ColorBall } from './ColorBall'
import { FourFiveDigitCountInput } from './FourFiveDigitCountInput'
import { toast } from '../../utils/toast'
import { usePositionConfig, resolvePositionColor } from '../../config/positionContext'

export const boxPermutation = (text: string): string[] => {
  if (text.length <= 1) return [text]
  if (new Set(text).size === 1) return [text]
  const resultSet = new Set<string>()
  for (let idx = 0; idx < text.length; idx++) {
    const char = text[idx]
    const remaining = text.slice(0, idx) + text.slice(idx + 1)
    const perms = boxPermutation(remaining)
    for (const o of perms) resultSet.add(char + o)
  }
  return Array.from(resultSet)
}

export const straightGeneration = (text: (string | null)[]): string[] => {
  const digitPool = Array.from({ length: 10 }, (_, r) => r.toString())
  const a: string[] = []
  const combine = (depth: number, current: string[]) => {
    if (depth === text.length) {
      a.push(current.join(''))
      return
    }
    const digit = text[depth]
    if (digit != null && digit !== '') {
      current.push(digit)
      combine(depth + 1, current)
      current.pop()
    } else {
      for (const c of digitPool) {
        current.push(c)
        combine(depth + 1, current)
        current.pop()
      }
    }
  }
  combine(0, [])
  return a
}

interface PressTarget {
  target: Element
}

interface DigitPickerProps {
  onAdd: (items: { value: string; count: number }[], target?: EventTarget) => void
  match: string
  canBetting?: boolean
  className?: string
  onFocus?: (e?: React.FocusEvent<HTMLInputElement>) => void
  onBlur?: (e?: React.FocusEvent<HTMLInputElement>) => void
}

export const DigitPicker = ({
  onAdd,
  match,
  canBetting = true,
  className,
  onFocus,
  onBlur,
  ...rest
}: DigitPickerProps) => {
  const { t } = useTranslation()
  const positionConfig = usePositionConfig()
  const [chars, len] = useMemo(() => [match.split(''), match.length], [match])
  const inputRefs = useRef<(HTMLInputElement | null)[]>(new Array(len).fill(null))
  const [digits, setDigits] = useState<(string | null)[]>(
    new Array(len).fill(null)
  )
  const [count, setCount] = useState('1')
  const [focusedIdx, setFocusedIdx] = useState(-1)

  const placeholder = useMemo(() => {
    const filled = digits.filter(Boolean).length
    const isFocusEmpty = focusedIdx > -1 && !digits[focusedIdx]
    return filled >= len - 2 || (filled >= len - 3 && isFocusEmpty)
      ? 'auto'
      : '-'
  }, [focusedIdx, len, digits])

  return (
    <div className={clsx('', className)} {...rest}>

      <div className="flex justify-between px-8 mb-4">
        {chars.map((ch, g) => {
          const borderColor = resolvePositionColor(positionConfig, g)
          return (
          <div key={g} className="flex flex-col items-center">
            <ColorBall index={g} color={ch} />
            <Input
              style={{
                borderRadius: '50%',
                border: borderColor ? `2px solid ${borderColor}` : undefined,
              }}
              max={9}
              min={0}
              maxLength={1}
              minLength={0}
              fullWidth={false}
              isDisabled={!canBetting}
              ref={(j: HTMLInputElement | null) => {
                inputRefs.current[g] = j
              }}
              value={digits[g] ?? ''}
              onValueChange={(j: string) => {

                const cleaned = j.replace(/[^0-9]/g, '').slice(-1)
                setDigits((k) => {
                  const C = [...k]
                  C[g] = cleaned || null
                  return C
                })

                if (cleaned && g < len - 1) {
                  const next = inputRefs.current[g + 1]
                  if (next) next.focus?.()
                }
              }}
              onBlur={(j: React.FocusEvent<HTMLInputElement>) => {
                setFocusedIdx(-1)
                onBlur?.(j)
              }}
              onFocus={(j: React.FocusEvent<HTMLInputElement>) => {
                setFocusedIdx(g)
                onFocus?.(j)
              }}
              enterKeyHint={g === len - 1 ? 'done' : 'next'}
              placeholder={focusedIdx === g ? '' : placeholder}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter') {
                  const next = inputRefs.current[g + 1]
                  if (next) next.focus?.()
                  else inputRefs.current[g]?.blur?.()
                }
              }}
              className="size-10 rounded-full mt-2 bg-light-gray digit-input"
              classNames={{
                inputWrapper:
                  'size-full p-0 min-h-0! rounded-full bg-transparent!',
                input:
                  'size-full text-sm! rounded-full text-center font-bold text-main placeholder:text-acc placeholder:font-medium',
              }}
            />
          </div>
          )
        })}
      </div>

      <div className="flex items-center">
        <FourFiveDigitCountInput
          className="w-10"
          containerProps={{ className: 'h-7' }}
          value={count}
          min={1}
          max={999}
          onValueChange={setCount}
        />
        <Button
          isDisabled={!canBetting}
          className="h-7 rounded-sm bg-transparent text-primary border border-primary px-3 mx-2 text-xs"
          onPress={() => {
            setDigits((y) => {
              const allFilled = y.every(Boolean)
              const allEmpty = y.every((k) => !k)
              return y.map((k) =>
                allFilled || allEmpty || !k
                  ? `${Math.floor(Math.random() * 10)}`
                  : k
              )
            })
          }}
        >
          {t('common.label.random')}
        </Button>
        <Button
          isDisabled={!canBetting}
          className="h-7.5 flex-1 rounded-sm bg-primary font-bold text-xs text-black mr-2"
          onPress={(y: PressTarget) => {
            if (digits.filter((g) => !!g).length < len) {
              toast.warning(
                t('digit.tip.warn.minlen', { num: len })
              )
              return
            }
            onAdd(
              boxPermutation(digits.join('')).map((g) => ({
                value: g,
                count: parseInt(count),
              })),
              y?.target
            )
            setDigits(new Array(len).fill(''))
          }}
        >
          {t('common.label.games.box')}
        </Button>
        <Button
          isDisabled={!canBetting}
          className="h-7.5 flex-1 rounded-sm bg-primary font-bold text-xs text-black"
          onPress={(y: PressTarget) => {
            if (digits.filter((g) => !!g).length < len - 2) {
              toast.warning(
                t('digit.tip.warn.minlen', { num: len - 2 })
              )
              return
            }
            onAdd(
              straightGeneration(digits).map((g) => ({
                value: g,
                count: parseInt(count),
              })),
              y?.target
            )
            setDigits(new Array(len).fill(''))
          }}
        >
          {t('common.label.games.add')}
        </Button>
      </div>
    </div>
  )
}
