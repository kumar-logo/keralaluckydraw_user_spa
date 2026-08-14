import { usePositionConfig, resolvePositionColor, resolvePositionLabel } from '../../config/positionContext'

interface DigitBallRowProps {
  digits: string
  positions?: string
  ballSize?: string
  fontSize?: string
  borderSize?: string
  showLabels?: boolean
}

export const DigitBallRow = ({
  digits,
  positions,
  ballSize = '1.5rem',
  fontSize = '0.875rem',
  borderSize = '0.125rem',
  showLabels = true,
}: DigitBallRowProps) => {
  const config = usePositionConfig()
  const chars = (digits || '').split('')
  const letters = positions != null ? positions.split('') : []

  return (
    <div className="flex items-end gap-x-1">
      {chars.map((digit, index) => {
        const letter = letters[index] ?? ''
        const positionIndex = letters.length > 0 ? config.labels.indexOf(letter) : index
        const borderColor = resolvePositionColor(config, positionIndex)
        const label = resolvePositionLabel(config, positionIndex, letter)
        return (
          <div key={index} className="flex flex-col items-center gap-y-0.5">
            <div
              className="flex items-center justify-center rounded-full bg-white dark:bg-gray font-bold text-main"
              style={{
                height: ballSize,
                width: ballSize,
                borderWidth: borderSize,
                borderColor,
                fontSize,
                lineHeight: ballSize,
              }}
            >
              {digit}
            </div>
            {showLabels && label ? (
              <span
                className="text-10 font-bold leading-none"
                style={{ color: borderColor || undefined }}
              >
                {label}
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
