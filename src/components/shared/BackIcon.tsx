import clsx from 'clsx'

export const BackIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    className={clsx('size-4 text-main rtl:rotate-180', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 16 16"
    {...props}
  >
    <path
      d="M10.5 2L5 7.99676L10.5 14"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
