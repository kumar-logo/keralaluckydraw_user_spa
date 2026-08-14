import { forwardRef } from 'react'
import { Spinner } from '@nextui-org/react'
import clsx from 'clsx'

interface SpinProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  dropClassName?: string
  loading?: boolean
  fixed?: boolean
  spinnerRender?: React.ReactNode
}

export const Spin = forwardRef<HTMLDivElement, SpinProps>(
  ({ children, dropClassName, loading = true, fixed, className, spinnerRender = <Spinner />, ...props }, ref) => (
    <div ref={ref} className={'relative flex ' + className} {...props}>
      {children}
      {loading && (
        <div
          className={clsx(
            'w-full h-full top-0 left-0 z-50 flex items-center justify-center bg-black/15',
            dropClassName,
            fixed ? 'fixed' : 'absolute'
          )}
        >
          {spinnerRender || <Spinner />}
        </div>
      )}
    </div>
  )
)

Spin.displayName = 'Spin'
