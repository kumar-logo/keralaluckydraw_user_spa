import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@nextui-org/react'
import { toast } from '../../utils/toast'

interface NumericInputProps {
  type?: string
  max?: number
  min?: number
  maxLength?: number
  decimal?: boolean
  value?: string
  onValueChange?: (v: string) => void
  onEnterKeyDown?: (e: React.KeyboardEvent) => void
  onBlur?: (e: React.FocusEvent) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  [key: string]: any
}

export const NumericInput = ({
  type = 'number',
  max = 9999,
  min = 1,
  maxLength = Infinity,
  decimal,
  value,
  onValueChange,
  onEnterKeyDown,
  onBlur,
  onKeyDown,
  ...restProps
}: NumericInputProps) => {
  const { t } = useTranslation()
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    if (localValue + '' !== value + '') setLocalValue(value)
  }, [value])

  const handleBlur = (val = localValue) => {
    if (!val) return onValueChange?.('')
    const parsed = parseInt(val as string)
    let clamped = parseInt(val as string)
    if (parsed > max) clamped = max
    else if (parsed < min) clamped = min
    setTimeout(() => { showWarning() }, 200)
    onValueChange?.(clamped + '')
  }

  const showWarning = () => {
    setLocalValue(prev => {
      if (!prev) return prev
      const parsed = parseInt(prev as string)
      let limit = max
      let warningKey = ''
      if (parsed > max) warningKey = 'maxAmount'
      else if (parsed < min) { limit = min; warningKey = 'minAmount' }
      if (warningKey) {
        toast.warning(t(`common.tip.warn.${warningKey}`, { num: limit }))
        return limit + ''
      }
      return prev
    })
  }

  return (
    <Input
      type={type}
      errorMessage=""
      onKeyDown={(event: React.KeyboardEvent) => {
        if (!decimal && event.key === '.') { event.preventDefault(); return }
        if (onKeyDown) onKeyDown(event)
        else if (event.key === 'Enter' && onEnterKeyDown) onEnterKeyDown(event)
      }}
      value={localValue as string}
      onValueChange={(val: string) => {
        if (!decimal && val.indexOf('.') > -1) return setLocalValue(val.split('.')[0])
        if (val.length > maxLength) return setLocalValue(val.slice(0, maxLength))
        setLocalValue(val)
      }}
      onBlur={(event: React.FocusEvent) => { handleBlur(); onBlur?.(event) }}
      {...restProps}
    />
  )
}
