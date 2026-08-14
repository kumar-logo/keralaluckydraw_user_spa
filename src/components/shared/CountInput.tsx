import { forwardRef, useRef, useImperativeHandle } from 'react'
import { Input } from '@nextui-org/react'

interface CountInputProps {
  onFocusBlur?: (focused: boolean) => void
  maxLength?: number
  className?: string
  onChange?: (value: string) => void
  value?: string
  maxCount?: number
  placeholder?: string
  inputClassName?: string
  endContent?: React.ReactNode
  includeZero?: boolean
  inputWrapClassName?: string
  isDisabled?: boolean
  baseStyle?: React.CSSProperties
  digitCircle?: boolean
  circleColor?: string
  circleSize?: number
}

export const CountInput = forwardRef<any, CountInputProps>(
  (
    {
      onFocusBlur,
      maxLength,
      className = '',
      onChange,
      value = '',
      maxCount = 99999,
      placeholder,
      inputClassName = '',
      endContent,
      includeZero = false,
      inputWrapClassName = '',
      isDisabled,
      baseStyle,
      digitCircle = false,
      circleColor,
      circleSize = 54,
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(
      ref,
      () => ({
        inputRef,
      }),
      [inputRef]
    )

    if (digitCircle) {
      return (
        <input
          ref={inputRef}
          className="digit-input"
          type="tel"
          inputMode="numeric"
          disabled={isDisabled}
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: '50%',
            textAlign: 'center',
            fontSize: Math.round(circleSize * 0.4),
            fontWeight: 700,
            color: '#2c2c2c',
            background: '#f2f2f2',
            outline: 'none',
            border: `2px solid ${circleColor || '#d9d9d9'}`,
          }}
          onChange={(e) => {
            const clean = e.target.value.replace(/\D/g, '').slice(-1)
            onChange?.(clean)
          }}
          onFocus={() => onFocusBlur?.(true)}
          onBlur={() => onFocusBlur?.(false)}
        />
      )
    }

    return (
      <Input
        style={baseStyle}
        classNames={{
          base: `border border-gray dark:border-text-sec rounded ${className}`,
          input: `text-main text-sm font-bold text-center h-full placeholder:text-acc placeholder:font-medium flex-1 min-h-auto ${inputClassName}`,
          inputWrapper: `px-3 py-0 min-h-auto bg-selected ${inputWrapClassName}`,
          innerWrapper: 'p-0',
        }}
        type="tel"
        ref={inputRef}
        isDisabled={isDisabled}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        endContent={endContent}
        onValueChange={(v) => {
          const regex = includeZero ? /^[0-9]*$/g : /^[1-9][0-9]*$/g
          if (!regex.test(v) && v !== '') {
            onChange?.(value)
            return
          }
          if (v === '') {
            onChange?.('')
            return
          }
          const clean = v.replace(/([^0-9])+/i, '')
          if (clean.length <= 0) {
            onChange?.('')
          } else if (+clean > maxCount) {
            onChange?.(maxCount + '')
          } else {
            onChange?.(clean + '')
          }
        }}
        onFocus={() => onFocusBlur?.(true)}
        onBlur={() => onFocusBlur?.(false)}
      />
    )
  }
)

CountInput.displayName = 'CountInput'
