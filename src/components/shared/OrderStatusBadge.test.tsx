import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders'
import { OrderStatusBadge } from './OrderStatusBadge'

vi.mock('../../utils/clipboard', () => ({
  copyToClipboard: vi.fn(),
}))

describe('OrderStatusBadge — order status + id rendering', () => {
  it('renders the "To Be Drawn" label for status 0', () => {
    renderWithProviders(<OrderStatusBadge code="ORD-1" status={0} />)
    expect(screen.getByText('To Be Drawn')).toBeInTheDocument()
    expect(screen.getByText('ORD-1')).toBeInTheDocument()
  })

  it('renders the "Won" label for status 1', () => {
    renderWithProviders(<OrderStatusBadge code="ORD-2" status={1} />)
    expect(screen.getByText('Won')).toBeInTheDocument()
  })

  it('renders the "No Win" label for status 2', () => {
    renderWithProviders(<OrderStatusBadge code="ORD-3" status={2} />)
    expect(screen.getByText('No Win')).toBeInTheDocument()
  })

  it('falls back to the To Be Drawn style for an out-of-range status', () => {
    renderWithProviders(<OrderStatusBadge code="ORD-4" status={99} />)
    expect(screen.getByText('To Be Drawn')).toBeInTheDocument()
  })

  it('copies the order id when the copy icon is clicked', async () => {
    const { copyToClipboard } = await import('../../utils/clipboard')
    const { container } = renderWithProviders(
      <OrderStatusBadge code="ORD-5" status={1} />,
    )
    const svg = container.querySelector('svg')
    svg?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(copyToClipboard).toHaveBeenCalledWith('ORD-5')
  })
})
