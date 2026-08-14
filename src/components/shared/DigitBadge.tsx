import clsx from 'clsx'

interface DigitBadgeProps {
  digit: string | number
  size?: string
  outline?: boolean
  textClass?: string
  className?: string
}

export const DigitBadge = ({
  digit,
  size = '1.25rem',
  outline = true,
  textClass = '',
  className = '',
}: DigitBadgeProps) => (
  <div
    style={{ width: size, height: size }}
    className={clsx(
      'justify-center flex items-center rounded-full',
      outline ? 'border border-main bg-white' : 'bg-black',
      className
    )}
  >
    <p className={clsx('font-bold text-sm', outline ? 'text-black' : 'text-white', textClass)}>
      {digit}
    </p>
  </div>
)
