import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '../test/i18n'
import type { TransferInfoDto } from '../services/financeApi'

const getTransferList = vi.fn<() => Promise<TransferInfoDto>>()
const transferBalance = vi.fn<(amount: number) => Promise<unknown>>()

vi.mock('../services/financeApi', () => ({
  getTransferList: () => getTransferList(),
  transferBalance: (amount: number) => transferBalance(amount),
}))

vi.mock('../utils/fetchBalance', () => ({ fetchAndSyncBalance: vi.fn() }))
vi.mock('../utils/toast', () => ({
  toast: { success: vi.fn(), warning: vi.fn(), show: vi.fn(), close: vi.fn() },
}))

import { TransferPage } from './TransferPage'

const INFO: TransferInfoDto = {
  mainBalance: 50,
  withdrawableBalance: 1000,
  minAmount: 300,
  maxAmount: 50000,
  list: [
    { minAmount: 300, maxAmount: 999, pct: 0.01 },
    { minAmount: 1000, maxAmount: 4999, pct: 0.03 },
    { minAmount: 5000, maxAmount: 50000, pct: 0.05 },
  ],
}

const renderPage = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <TransferPage />
      </MemoryRouter>
    </I18nextProvider>
  )

const confirmButton = () =>
  screen.getByRole('button', { name: 'Confirm' }) as HTMLButtonElement
const amountInput = () => screen.getByRole('spinbutton') as HTMLInputElement

describe('TransferPage — button enable/disable + i18n labels', () => {
  beforeEach(() => {
    getTransferList.mockReset().mockResolvedValue(INFO)
    transferBalance.mockReset().mockResolvedValue({})
  })

  it('renders the translated "Transfer Records" label (not the raw key)', async () => {
    renderPage()
    expect(await screen.findByText('Transfer Records')).toBeInTheDocument()
    expect(screen.queryByText(/common\.label|recharge\.transfer/)).toBeNull()
  })

  it('keeps the button disabled before any amount is entered', async () => {
    renderPage()
    await screen.findByText('Transfer Records')
    expect(confirmButton()).toBeDisabled()
  })

  it('ENABLES the button on a valid amount within balance and min/max', async () => {
    renderPage()
    await screen.findByText('Transfer Records')
    fireEvent.change(amountInput(), { target: { value: '500' } })
    await waitFor(() => expect(confirmButton()).not.toBeDisabled())
  })

  it('keeps the button disabled and shows the below-min hint for an amount under the minimum', async () => {
    renderPage()
    await screen.findByText('Transfer Records')
    fireEvent.change(amountInput(), { target: { value: '200' } })
    await waitFor(() => expect(confirmButton()).toBeDisabled())
    expect(screen.getByText('Minimum transfer amount is ₹300.00')).toBeInTheDocument()
  })

  it('keeps the button disabled and shows the over-max hint for an amount over the balance', async () => {
    renderPage()
    await screen.findByText('Transfer Records')
    fireEvent.change(amountInput(), { target: { value: '2000' } })
    await waitFor(() => expect(confirmButton()).toBeDisabled())
    expect(screen.getByText('Maximum transfer amount is ₹1,000.00')).toBeInTheDocument()
  })

  it('keeps the button disabled and shows the insufficient hint when bonus balance is below the minimum', async () => {
    getTransferList.mockResolvedValue({ ...INFO, withdrawableBalance: 0 })
    renderPage()
    await screen.findByText('Transfer Records')
    fireEvent.change(amountInput(), { target: { value: '300' } })
    await waitFor(() =>
      expect(screen.getByText('Not enough transferable balance')).toBeInTheDocument()
    )
    expect(confirmButton()).toBeDisabled()
  })
})
