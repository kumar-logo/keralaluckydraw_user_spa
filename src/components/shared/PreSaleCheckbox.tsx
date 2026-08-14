interface PreSaleCheckboxProps {
  checked: boolean
  onCheck: (checked: boolean) => void
  label?: React.ReactNode
}

export const PreSaleCheckbox = ({ checked, onCheck, label }: PreSaleCheckboxProps) => (
  <div className="flex" onClick={() => onCheck(!checked)}>
    <div className={`common-pay-ratio w-4 h-4 rounded-2xl mr-3 flex items-center justify-center ${checked ? 'checked' : ''}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2" viewBox="0 0 10 8" fill="none">
        <rect x="1.91431" y="2.65332" width="4.94301" height="2" rx="1" transform="rotate(45 1.91431 2.65332)" fill="white" />
        <rect x="2.58301" y="6.14893" width="7.98862" height="2" rx="1" transform="rotate(-45 2.58301 6.14893)" fill="white" />
      </svg>
    </div>
    {label}
  </div>
)
