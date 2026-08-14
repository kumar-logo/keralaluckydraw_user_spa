import clsx from 'clsx'

const SPRITE_BASE = {
  backgroundImage: 'url(/images/games/wingo/draw-sprite.webp)',
  backgroundSize: '55.5rem 33.125rem',
}

export const drawDigitStyle = (x: number, y: number) => ({
  ...SPRITE_BASE,
  backgroundSize: '27.75rem 16.5625rem',
  backgroundPosition: `left -${x * 2.25}rem top -${y * 2.25}rem`,
})

interface ColorDrawDigitProps {
  x: number
  y: number
  active?: boolean
  digit: number
}

export const ColorDrawDigit = ({ x, y, active, digit }: ColorDrawDigitProps) => (
  <div
    data-digit={digit}
    data-x={x}
    data-y={y}
    className={clsx(
      'size-8.5 relative before:size-10.5 before:block before:bg-white before:rounded-full before:blur-xs before:absolute before:-left-1 before:-top-1 before:-z-1 before:duration-50',
      active ? 'before:opacity-100' : 'before:opacity-0'
    )}
    style={drawDigitStyle(x, y)}
  />
)
