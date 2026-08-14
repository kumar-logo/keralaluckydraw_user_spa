import { DigitBallRow } from './DigitBallRow'
import { CloseCircleIcon } from './CloseCircleIcon'

interface BetSlipChipProps {
  type?: string
  digit?: string
  rate?: number
  onClose?: () => void
  ballSize?: string
}

export const BetSlipChip = ({
  type = '',
  digit = '',
  rate = 3,
  onClose = () => {},
  ballSize = '1.5rem',
}: BetSlipChipProps) => (
  <div className="bg-light-gray rounded-sm relative flex items-center flex-row px-2 py-1 mt-2">
    <DigitBallRow digits={digit} positions={type} ballSize={ballSize} />
    <div className="h-4 flex justify-center items-center ml-2 rounded-sm bg-gray px-1">
      <p className="text-10 text-sec font-bold">x{rate}</p>
    </div>
    <div onClick={onClose} className="absolute -right-2 -top-2">
      <CloseCircleIcon />
    </div>
  </div>
)
