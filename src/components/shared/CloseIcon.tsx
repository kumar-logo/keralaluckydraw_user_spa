import clsx from 'clsx'

export const CloseIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    className={clsx('size-6 text-sec', className)}
    fill="none"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M16.8002 7.2002L7.2002 16.8002"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.2002 7.2002L16.8002 16.8002"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
