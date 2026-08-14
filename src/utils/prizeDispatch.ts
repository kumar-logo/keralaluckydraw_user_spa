export function dispatchPrizeNotification(prize: number | { amount?: number; spin?: number; tickets?: number; autoClose?: boolean | number; jackpotCutoff?: number }, isCash = true) {
  const detail = typeof prize === 'number'
    ? { amount: prize, spin: 0, tickets: 0, jackpotCutoff: 100, isCash }
    : { ...prize, isCash }

  if (detail.amount || detail.spin || detail.tickets) {
    window.dispatchEvent(new CustomEvent('showBouns', { detail }))
  }
}
