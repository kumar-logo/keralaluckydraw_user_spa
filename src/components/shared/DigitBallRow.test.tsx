import { describe, it, expect } from 'vitest'
import { render, within } from '@testing-library/react'
import { PositionConfigProvider } from '../../config/positionConfig'
import { DigitBallRow } from './DigitBallRow'

const COLORS = ['rgb(255, 0, 0)', 'rgb(255, 165, 0)', 'rgb(0, 0, 255)']
const LABELS = ['A', 'B', 'C']

const renderRow = (ui: React.ReactElement) =>
  render(
    <PositionConfigProvider colors={COLORS} labels={LABELS}>
      {ui}
    </PositionConfigProvider>,
  )

const balls = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('.flex.flex-col.items-center'))

describe('DigitBallRow — shared digit/slat ball renderer', () => {
  it('maps each ordered digit to its position color and label from the config', () => {
    const { container } = renderRow(<DigitBallRow digits="123" />)
    const cells = balls(container)
    expect(cells).toHaveLength(3)
    cells.forEach((cell, index) => {
      const ball = cell.firstElementChild as HTMLElement
      expect(ball.style.borderColor).toBe(COLORS[index])
      expect(ball.textContent).toBe(String(index + 1))
      expect(within(cell).getByText(LABELS[index])).toBeInTheDocument()
    })
  })

  it('resolves color and label from the position letter, not the array index', () => {
    const { container } = renderRow(<DigitBallRow digits="57" positions="BC" />)
    const cells = balls(container)
    expect(cells).toHaveLength(2)

    const first = cells[0].firstElementChild as HTMLElement
    expect(first.textContent).toBe('5')
    expect(first.style.borderColor).toBe(COLORS[1])
    expect(within(cells[0]).getByText('B')).toBeInTheDocument()

    const second = cells[1].firstElementChild as HTMLElement
    expect(second.textContent).toBe('7')
    expect(second.style.borderColor).toBe(COLORS[2])
    expect(within(cells[1]).getByText('C')).toBeInTheDocument()
  })

  it('renders placeholder result digits with the position colors when undrawn', () => {
    const { container } = renderRow(<DigitBallRow digits="***" />)
    const cells = balls(container)
    expect(cells).toHaveLength(3)
    cells.forEach((cell, index) => {
      const ball = cell.firstElementChild as HTMLElement
      expect(ball.textContent).toBe('*')
      expect(ball.style.borderColor).toBe(COLORS[index])
    })
  })

  it('hides labels when showLabels is false', () => {
    const { container, queryByText } = renderRow(<DigitBallRow digits="12" showLabels={false} />)
    expect(balls(container)).toHaveLength(2)
    expect(queryByText('A')).not.toBeInTheDocument()
    expect(queryByText('B')).not.toBeInTheDocument()
  })
})
