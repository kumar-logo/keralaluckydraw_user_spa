export const PaginationArrow = ({ left = true }: { left?: boolean }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={left ? '' : 'rotate-180'}
  >
    <path
      d="M7 9.22222L3.88889 6.11111L7 3"
      stroke="var(--font-color-secAccent)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
