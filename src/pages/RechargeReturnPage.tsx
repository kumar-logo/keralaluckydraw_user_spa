import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { verifyYpayment } from '../services/financeApi'
import { fetchAndSyncBalance } from '../utils/fetchBalance'
import { TopBarWrapper } from '../components/shared/TopBarWrapper'
import { Spin } from '../components/shared/Spin'

type Phase = 'checking' | 'success' | 'pending'

export const RechargeReturnPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('checking')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const orderNo = params.get('order_id') || params.get('orderNo') || ''
    const statusParam = params.get('status')
    if (statusParam === 'success') {
      setPhase('success')
      fetchAndSyncBalance()
      return
    }
    if (statusParam === 'failed') {
      setPhase('pending')
      return
    }
    const gatewayId = params.get('gateway_id') || params.get('gatewayId')
    if (!orderNo) {
      setPhase('pending')
      return
    }
    verifyYpayment(orderNo, gatewayId ? Number(gatewayId) : undefined)
      .then((data: { credited?: boolean; status?: string } | null) => {
        if (data?.credited || data?.status === 'success') {
          setPhase('success')
          fetchAndSyncBalance()
        } else {
          setPhase('pending')
        }
      })
      .catch(() => setPhase('pending'))
  }, [])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBarWrapper title={t('common.label.recharge')} rightNode={null} rightNodeType="service" />
      <Spin className="flex-1 flex flex-col items-center justify-center" loading={phase === 'checking'}>
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className={`size-16 rounded-full flex items-center justify-center mb-4 ${phase === 'success' ? 'bg-[#009919]/10' : 'bg-tip/10'}`}>
            {phase === 'success' ? (
              <svg viewBox="0 0 24 24" className="size-8 text-[#009919]" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="size-8 text-tip" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 8v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className="text-base font-bold text-main mb-2">
            {phase === 'success' ? t('recharge.recharge.success', 'Recharge Successful') : t('recharge.recharge.pending', 'Payment Pending')}
          </div>
          <div className="text-xs text-acc mb-6">
            {phase === 'success'
              ? t('recharge.recharge.successDesc', 'Your balance has been credited.')
              : t('recharge.recharge.pendingDesc', 'If the amount was debited, it will reflect shortly.')}
          </div>
          <div className="flex gap-3">
            <button
              className="h-10 px-6 rounded-full bg-selected text-main text-sm font-bold"
              onClick={() => navigate('/record/recharge')}
            >
              {t('recharge.recharge.rechargeRecords')}
            </button>
            <button
              className="h-10 px-6 rounded-full bg-linear-primary-tr text-black text-sm font-bold"
              onClick={() => navigate('/index/me')}
            >
              {t('common.label.confirm', 'Confirm')}
            </button>
          </div>
        </div>
      </Spin>
    </div>
  )
}

export default RechargeReturnPage
