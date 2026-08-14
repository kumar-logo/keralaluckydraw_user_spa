import { forwardRef } from 'react'
import { Spinner } from '@nextui-org/react'
import { useButton } from '@nextui-org/button'

type UseButtonProps = Parameters<typeof useButton>[0]
import { Ripple } from '@nextui-org/ripple'
import { toast } from '../../utils/toast'

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tip?: string
  isDisabled?: boolean
  isLoading?: boolean
  isIconOnly?: boolean
  disableRipple?: boolean
  spinnerPlacement?: 'start' | 'end'
  startContent?: React.ReactNode
  endContent?: React.ReactNode
  onPress?: () => void
  color?: string
  variant?: string
  size?: string
  ref?: React.Ref<HTMLButtonElement>
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ tip, isDisabled, disabled, ...props }, ref) => {
    const {
      domRef,
      children,
      styles,
      spinnerSize,
      spinner = <Spinner color="current" size={spinnerSize} />,
      spinnerPlacement,
      startContent,
      endContent,
      isLoading,
      disableRipple,
      getButtonProps,
      getRippleProps,
      isIconOnly,
    } = useButton({
      isDisabled,
      disabled,
      ...props,
      ref,
    } as UseButtonProps)

    const { onClick, ...buttonProps } = getButtonProps()

    return (
      <button
        ref={domRef}
        className={styles + (disabled || isDisabled ? ' opacity-30' : '')}
        onClick={(e) => {
          if (disabled || isDisabled) {
            if (tip) toast.show({ icon: 'warning', message: tip })
          } else {
            onClick?.(e)
          }
        }}
        {...buttonProps}
      >
        {startContent}
        {isLoading && spinnerPlacement === 'start' && spinner}
        {isLoading && isIconOnly ? null : children}
        {isLoading && spinnerPlacement === 'end' && spinner}
        {endContent}
        {!disableRipple && <Ripple {...getRippleProps()} />}
      </button>
    )
  }
)

AnimatedButton.displayName = 'HeroUI.CusButton'
