import {
  usePositionConfig,
  resolvePositionColor,
  resolvePositionLabel,
} from '../../config/positionContext'

const isHexColor = (value: string): boolean => value.startsWith('#')

interface ColorBallProps {
  ballSize?: string
  color?: string
  digit?: string
  fontSize?: string
  borderSize?: string
  index?: number
}

export const ColorBall = ({
  ballSize = '1.5rem',
  color = 'A',
  digit,
  fontSize = '0.875rem',
  borderSize = '0.125rem',
  index,
}: ColorBallProps) => {
  const config = usePositionConfig()
  const positionIndex = index ?? (isHexColor(color) ? -1 : config.labels.indexOf(color))
  const borderColor = isHexColor(color)
    ? color
    : resolvePositionColor(config, positionIndex)
  const labelFallback = isHexColor(color) ? '' : color
  const content = digit ?? resolvePositionLabel(config, positionIndex, labelFallback)
  return (
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
      {content}
    </div>
  )
}

interface ColorResultProps {
  result: string
  ballSize?: string
  fontSize?: string
  borderSize?: string
}

export const ColorResult = ({
  result,
  ballSize = '1.5rem',
  fontSize = '0.875rem',
  borderSize = '0.125rem',
}: ColorResultProps) => (
  <>
    {(result || '').split('').map((char, index) => (
      <ColorBall
        key={index}
        index={index}
        digit={char}
        ballSize={ballSize}
        fontSize={fontSize}
        borderSize={borderSize}
      />
    ))}
  </>
)
