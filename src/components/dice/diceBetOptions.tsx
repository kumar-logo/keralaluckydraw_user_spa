import type { ReactNode } from 'react'
import type { DiceOdds } from '../../services/diceApi'
import { DiceSingle, DiceNum, DiceSumBadge } from './DiceVisuals'
import { NUM_NAMES, NAME_TO_NUM, sumCodeMap, type DiceBetOption } from './diceConstants'

export function buildSumOptions(odds?: DiceOdds): DiceBetOption[] {
  return ['big', 'small', 'odd', 'even'].map(a => ({
    code: `sum_${a}`,
    render: <DiceSumBadge type={a} size={48} />,
    payRender: <DiceSumBadge type={a} size={64} />,
    rate: odds ? odds[`sum_${a}`] + '' : '0',
  }))
}

export function buildSumPointOptions(odds?: DiceOdds): DiceBetOption[] {
  return Array(16).fill(0).map((_, i) => i + 3).map(n => ({
    code: `sum_${NUM_NAMES[n]}`,
    render: <DiceNum num={n} size={40} />,
    payRender: <DiceNum num={n} size={64} />,
    rate: odds && odds[`sum_${NUM_NAMES[n]}`] + '' || '0',
  }))
}

export function buildSingleOptions(odds?: DiceOdds): DiceBetOption[] {
  return Array(6).fill(0).map((_, i) => i + 1).map(n => ({
    code: `single_${NUM_NAMES[n]}`,
    render: <DiceSingle size={28} num={n} />,
    payRender: <DiceSingle size={64} num={n} />,
    rate: odds && odds[`single_${NUM_NAMES[n]}`] + '' || '0',
  }))
}

export function buildPairOptions(odds?: DiceOdds): DiceBetOption[] {
  return Array(6).fill(0).map((_, i) => i + 1).map(n => ({
    code: `double_${NUM_NAMES[n]}`,
    render: (
      <div className="flex">
        <DiceSingle size={28} num={n} />
        <div className="w-1" />
        <DiceSingle size={28} num={n} />
      </div>
    ),
    payRender: (
      <div className="flex">
        <DiceSingle size={48} num={n} />
        <div className="w-1" />
        <DiceSingle size={48} num={n} />
      </div>
    ),
    rate: odds ? odds[`double_${NUM_NAMES[n]}`] + '' : '0',
  }))
}

export function buildTripleOptions(odds?: DiceOdds): DiceBetOption[] {
  return Array(7).fill(0).map((_, i) => i).map(n => ({
    code: `leopard_${n >= 1 ? NUM_NAMES[n] : 'any'}`,
    render: (
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center mb-1"><DiceSingle size={20} num={n} /></div>
        <div className="flex"><DiceSingle size={20} num={n} /><div className="w-1" /><DiceSingle size={20} num={n} /></div>
      </div>
    ),
    renderRow: (
      <div className="flex">
        <DiceSingle size={20} num={n} /><div className="w-1" /><DiceSingle size={20} num={n} /><div className="w-1" /><DiceSingle size={20} num={n} />
      </div>
    ),
    payRender: (
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center mb-1"><DiceSingle size={48} num={n} /></div>
        <div className="flex"><DiceSingle size={48} num={n} /><div className="w-1" /><DiceSingle size={48} num={n} /></div>
      </div>
    ),
    rate: odds && odds[`leopard_${n >= 1 ? NUM_NAMES[n] : 'any'}`] + '' || '0',
  }))
}

export function renderBetIcon(code: string): ReactNode {
  if (!code) return null
  if (sumCodeMap[code]) return <DiceSumBadge size={24} type={sumCodeMap[code]} />
  const [prefix, name] = code.split('_')
  const num = NAME_TO_NUM[name] || 0
  if (prefix === 'sum') return <DiceNum size={24} num={num} />
  if (prefix === 'single') return <DiceSingle size={24} num={num} />
  if (prefix === 'double') return (
    <div className="flex"><DiceSingle size={24} num={num} /><DiceSingle size={24} num={num} /></div>
  )
  if (prefix === 'leopard') return (
    <div className="flex"><DiceSingle size={24} num={num} /><DiceSingle size={24} num={num} /><DiceSingle size={24} num={num} /></div>
  )
  return null
}
