import i18n from 'i18next'
import { useAuthStore } from '../stores/authStore'
import { toast } from './toast'

export const checkInsufficientBalance = (amount: number, gameId: string, useBonus?: boolean): boolean => {
  if (amount !== amount) return false
  const authState = useAuthStore.getState()
  return useBonus
    ? !authState.bonusBalance || authState.bonusBalance < amount
      ? (toast.warning(i18n.t('common.tip.info.bonusNotEnought')), true)
      : false
    : authState.balance < amount
      ? (window.dispatchEvent(new CustomEvent('openRechargeDraw', {
          detail: { origin: `bet_${gameId}_insufficient_balance` },
        })), true)
      : false
}
