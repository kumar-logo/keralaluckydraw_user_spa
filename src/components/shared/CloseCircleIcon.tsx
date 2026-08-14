import clsx from 'clsx'

export const CloseCircleIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    className={clsx('size-4', className)}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    {...props}
  >
    <rect className="size-full" rx="8" fill="currentColor" />
    <path
      d="M10.6663 5.33398L5.33301 10.6673"
      stroke="white"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.33301 5.33398L10.6663 10.6673"
      stroke="white"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
