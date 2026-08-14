import clsx from 'clsx'

export const RulesIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    className={clsx('size-5', className)}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#clip0_20110_26478)">
      <path
        d="M11.998 22C14.7594 22 17.2594 20.8807 19.0691 19.0711C20.8787 17.2614 21.998 14.7614 21.998 12C21.998 9.2386 20.8787 6.7386 19.0691 4.92893C17.2594 3.11929 14.7594 2 11.998 2C9.23665 2 6.73665 3.11929 4.92698 4.92893C3.11734 6.7386 1.99805 9.2386 1.99805 12C1.99805 14.7614 3.11734 17.2614 4.92698 19.0711C6.73665 20.8807 9.23665 22 11.998 22Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M12 14.3125V12.3125C13.6568 12.3125 15 10.9693 15 9.3125C15 7.65565 13.6568 6.3125 12 6.3125C10.3432 6.3125 9 7.65565 9 9.3125"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 18.8125C12.6904 18.8125 13.25 18.2529 13.25 17.5625C13.25 16.8722 12.6904 16.3125 12 16.3125C11.3097 16.3125 10.75 16.8722 10.75 17.5625C10.75 18.2529 11.3097 18.8125 12 18.8125Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_20110_26478">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
)
