import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders'
import { WinLoseStatus } from './WinLoseStatus'

describe('WinLoseStatus — order result rendering', () => {
  it('renders nothing before the round is drawn', () => {
    const { container } = renderWithProviders(
      <WinLoseStatus drawn={false} win={false} />,
    )
    expect(container.textContent).toBe('')
  })

  it('shows the formatted win amount when the bet won', async () => {
    renderWithProviders(<WinLoseStatus drawn win winAmount={1500} />)
    await waitFor(() => {
      expect(screen.getByText('₹1,500.00')).toBeInTheDocument()
    })
    expect(screen.getByText('Congratulations, You have won!')).toBeInTheDocument()
  })

  it('shows the lose message when the bet lost', async () => {
    renderWithProviders(<WinLoseStatus drawn win={false} winAmount={0} />)
    await waitFor(() => {
      expect(
        screen.getByText('Sorry, Your guessing is wrong, Try next time'),
      ).toBeInTheDocument()
    })
  })

  it('shows the settling message while settlement is syncing (not lose)', async () => {
    renderWithProviders(<WinLoseStatus drawn win settleSyncing winAmount={1500} />)
    await waitFor(() => {
      expect(
        screen.getByText('Settlement in progress, please wait...'),
      ).toBeInTheDocument()
    })
    expect(screen.queryByText('₹1,500.00')).not.toBeInTheDocument()
  })
})
