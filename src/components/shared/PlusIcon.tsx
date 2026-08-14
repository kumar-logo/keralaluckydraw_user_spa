import clsx from 'clsx'

export const PlusIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    className={clsx('size-3', className)}
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect x="1" y="5" width="10" height="2" rx="1" fill="currentColor" />
    <rect
      x="5"
      y="11"
      width="10"
      height="2"
      rx="1"
      transform="rotate(-90 5 11)"
      fill="currentColor"
    />
  </svg>
)
