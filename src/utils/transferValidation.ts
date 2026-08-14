export interface TransferLimits {
  withdrawableBalance: number
  minAmount: number
  maxAmount: number
}

export interface TransferValidation {
  maxTransferable: number
  hasEnoughBalance: boolean
  isValid: boolean
  errorKey: string
}

const TRANSFER_ERROR = {
  insufficient: 'recharge.transfer.action.insufficient',
  belowMin: 'recharge.transfer.action.belowMin',
  overMax: 'recharge.transfer.action.overMax',
} as const

export const evaluateTransfer = (
  rawAmount: string,
  limits: TransferLimits
): TransferValidation => {
  const transferable = Math.floor(limits.withdrawableBalance)
  const ceiling = limits.maxAmount > 0 ? limits.maxAmount : transferable
  const maxTransferable = Math.min(transferable, ceiling)
  const hasEnoughBalance = transferable >= limits.minAmount

  const num = Number(rawAmount)
  const amountEntered = rawAmount.trim().length > 0 && Number.isFinite(num)

  if (!hasEnoughBalance) {
    return { maxTransferable, hasEnoughBalance, isValid: false, errorKey: TRANSFER_ERROR.insufficient }
  }
  if (!amountEntered || num <= 0) {
    return { maxTransferable, hasEnoughBalance, isValid: false, errorKey: '' }
  }
  if (num < limits.minAmount) {
    return { maxTransferable, hasEnoughBalance, isValid: false, errorKey: TRANSFER_ERROR.belowMin }
  }
  if (num > maxTransferable) {
    return { maxTransferable, hasEnoughBalance, isValid: false, errorKey: TRANSFER_ERROR.overMax }
  }
  return { maxTransferable, hasEnoughBalance, isValid: true, errorKey: '' }
}
