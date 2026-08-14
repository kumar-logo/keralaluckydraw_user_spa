import { useMemo, useContext, createContext } from 'react'
import { useAppConfigStore } from '../../stores/configStore'

export const WingoColorContext = createContext<Record<string, string[]> | null>(
  null,
)

const STRING_COLOR: Record<string, string> = {
  VIOLET: 'violet',
  RED: 'red',
  GREEN: 'green',
  '-': 'gray',
}

const FONT_SIZE_MAP: Record<number, number> = {
  28: 12,
  32: 14,
  52: 20,
  56: 24,
}

const colorVar = (name: string) =>
  name === 'gray' ? '#9ca3af' : `var(--game-color-${name})`

const backgroundFor = (colors: string[]): React.CSSProperties => {
  if (!colors || colors.length === 0) return {}
  if (colors.length === 1) return { backgroundColor: colorVar(colors[0]) }
  return {
    background: `linear-gradient(315deg, ${colorVar(colors[1])} 50.5%, ${colorVar(colors[0])} 51.88%)`,
  }
}

const resolveColors = (content: number | string, fromConfig: string[]): string[] => {
  if (fromConfig && fromConfig.length > 0) return fromConfig
  if (typeof content === 'number') return []
  const mapped = STRING_COLOR[content]
  return mapped ? [mapped] : []
}

const useNumberColors = (content: number | string): string[] => {
  const colorMap = useAppConfigStore((s) => s.colorMap)
  const perGame = useContext(WingoColorContext)
  if (typeof content !== 'number') return []
  const key = String(content)
  return perGame?.[key] ?? colorMap?.[key] ?? []
}

interface OutlineBallProps {
  content: number | string
  size: number
  disabled?: boolean
  fontSize?: number
  border?: boolean
}

export const OutlineBall = ({ content, size, disabled = false, fontSize, border }: OutlineBallProps) => {
  const sizeRem = size / 16
  const fontSizeRem = useMemo(() => (FONT_SIZE_MAP[size] || 14) / 16, [size])
  const textSizeRem = sizeRem * 12 / 48
  const fromConfig = useNumberColors(content)
  const bg = backgroundFor(resolveColors(content, fromConfig))

  return (
    <div
      className={`wingo-ball ${disabled ? 'disabled' : ''} ${border ? 'has-border' : ''} font-bold flex items-center text-white rounded-full justify-center text-center`}
      style={{ width: `${sizeRem}rem`, height: `${sizeRem}rem`, ...bg }}
    >
      <span
        className={typeof content === 'number' ? '' : 'din'}
        style={{ fontSize: `${fontSize ? fontSize / 16 : (typeof content === 'number' ? fontSizeRem : textSizeRem)}rem` }}
      >
        {content}
      </span>
    </div>
  )
}

interface FullBallProps {
  content: number | string
  size: number
  none?: boolean
  textSize?: number
  noneClass?: string
}

export const FullBall = ({ content, size, none = false, textSize, noneClass = '' }: FullBallProps) => {
  const sizeRem = size / 16
  const numFontSize = textSize ? textSize / 16 : sizeRem * 18 / 48
  const strFontSize = textSize ? textSize / 16 : sizeRem * 12 / 48
  const fromConfig = useNumberColors(content)
  const bg = none ? {} : backgroundFor(resolveColors(content, fromConfig))

  return (
    <div
      className={`font-bold flex items-center wingo-ball rounded-full justify-center text-center text-main has-border ${
        none ? noneClass : 'text-white'
      }`}
      style={{ width: `${sizeRem}rem`, height: `${sizeRem}rem`, ...bg }}
    >
      <span
        className={typeof content === 'number' ? '' : 'din'}
        style={{ fontSize: `${typeof content === 'number' ? numFontSize : strFontSize}rem` }}
      >
        {content}
      </span>
    </div>
  )
}
