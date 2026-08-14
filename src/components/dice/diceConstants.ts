import type { ReactNode } from 'react'

export const NUM_NAMES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen'] as const

export const NAME_TO_NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
}

export const sumCodeMap: Record<string, string> = {
  sum_big: 'big', sum_small: 'small', sum_odd: 'odd', sum_even: 'even',
}

export interface DiceBetOption {
  code: string
  render: ReactNode
  payRender: ReactNode
  renderRow?: ReactNode
  rate: string
}

export function getDiceResultColor(result: string) {
  const parts = (result || '').split(',').filter((v) => v !== '')
  const joined = parts.join('')
  const sum = parts.reduce((acc, val) => acc + +val, 0)
  if (['111', '222', '333', '444', '555', '666'].includes(joined)) return { sum, color: 'g' }
  return sum <= 10 ? { sum, color: 'b' } : { sum, color: 'r' }
}
