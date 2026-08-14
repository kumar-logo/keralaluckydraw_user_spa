export enum ColorBetKind {
  Number = 'number',
  Color = 'color',
  Size = 'size',
  Unknown = 'unknown',
}

const DIGIT_PATTERN = /^\d+$/

const COLOR_INITIALS = ['g', 'r', 'v']

const COLOR_NAME_BY_INITIAL: Record<string, string> = {
  g: 'GREEN',
  r: 'RED',
  v: 'VIOLET',
}

const SIZE_NAME_BY_INITIAL: Record<string, string> = {
  b: 'BIG',
  s: 'SMALL',
}

const normalize = (code: string | number): string => String(code).trim().toLowerCase()

const firstToken = (value: string): string => value.split(',')[0]?.trim() ?? ''

export const classifyColorBet = (code: string | number): ColorBetKind => {
  const value = normalize(code)
  if (DIGIT_PATTERN.test(value)) return ColorBetKind.Number
  const initial = firstToken(value).charAt(0)
  if (COLOR_INITIALS.includes(initial)) return ColorBetKind.Color
  if (initial === 'b' || initial === 's') return ColorBetKind.Size
  return ColorBetKind.Unknown
}

export const colorBetName = (code: string | number): string => {
  const initial = firstToken(normalize(code)).charAt(0)
  return COLOR_NAME_BY_INITIAL[initial] ?? 'RED'
}

export const sizeBetName = (code: string | number): string => {
  const initial = normalize(code).charAt(0)
  return SIZE_NAME_BY_INITIAL[initial] ?? 'BIG'
}
