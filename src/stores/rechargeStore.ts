import { create } from 'zustand'

interface RechargeStore {
  rechargeIsOpen: boolean
  rechargeOrigin: string
  rechargeAmount: string
  openRecharge: (origin?: string, amount?: string) => void
  closeRecharge: () => void
  onRechargeOpenChange: () => void
}

export const useRechargeStore = create<RechargeStore>((set) => ({
  rechargeIsOpen: false,
  rechargeOrigin: '',
  rechargeAmount: '',
  openRecharge: (origin = '', amount = '') => {
    set({
      rechargeIsOpen: true,
      rechargeOrigin: origin,
      rechargeAmount: amount,
    })
    window.dispatchEvent(
      new CustomEvent('openRechargeDraw', {
        detail: { origin, amount },
      }),
    )
  },
  closeRecharge: () => {
    set({ rechargeIsOpen: false })
  },
  onRechargeOpenChange: () => {
    set((state) => ({ rechargeIsOpen: !state.rechargeIsOpen }))
  },
}))
