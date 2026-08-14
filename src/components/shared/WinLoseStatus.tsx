import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/format'

const WinAmount = ({ amount }: { amount: number }) => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center py-2 text-center">
      <span className="text-xs text-primary">{t('common.tip.info.orderWin')}</span>
      <span className="text-sm font-bold text-primary din">{formatCurrency(amount)}</span>
    </div>
  )
}

interface WinLoseStatusProps {
  drawn: boolean
  win: boolean
  winAmount?: number
  settleSyncing?: boolean
}

export const WinLoseStatus = ({ drawn, win, winAmount, settleSyncing }: WinLoseStatusProps) => {
  const { t, i18n } = useTranslation()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    i18n.loadNamespaces('order').then(() => {
      setLoaded(true)
    })
  }, [i18n])

  const isWin = useMemo(() => drawn && !settleSyncing && win, [drawn, settleSyncing, win])
  const isLose = useMemo(() => drawn && !settleSyncing && !win, [drawn, settleSyncing, win])

  if (!loaded) return <></>

  return (
    <>
      {drawn && isWin && <WinAmount amount={winAmount || 0} />}
      {drawn && !isWin && (
        <div className="py-2 text-primary text-sm text-center">
          {t(isLose ? 'common.tip.info.orderNoWin' : 'order.tip.settleSyncing')}
        </div>
      )}
    </>
  )
}
