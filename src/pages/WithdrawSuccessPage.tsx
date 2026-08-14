import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@nextui-org/react'
import { formatCurrency } from '../utils/format'
import { TopBar } from '../components/shared/TopBar'

export const WithdrawSuccessPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const amount = (location.state as { amount?: number } | null)?.amount || 0

  return (
    <div className="size-full flex flex-col">
      <TopBar title={t('common.label.withdraw')} onBack={() => navigate('/index', { replace: true })} />

      <div className="flex-1 flex flex-col items-center justify-center px-6">

        <div className="size-20 rounded-full bg-[#009919] flex items-center justify-center mb-6">
          <svg className="size-10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-main mb-2">
          {t('withdraw.tip.submitSuccess')}
        </h2>

        {amount > 0 && (
          <p className="text-2xl font-black text-primary mb-4">{formatCurrency(amount)}</p>
        )}

        <p className="text-sm text-acc text-center mb-8">
          {t('withdraw.tip.successDesc')}
        </p>

        <Button
          className="h-13 text-black font-bold text-base rounded-full bg-linear-primary-tb shadow-btn-primary w-full max-w-xs"
          onPress={() => navigate('/index', { replace: true })}
        >
          {t('common.label.backHome')}
        </Button>

        <Button
          className="mt-3 h-10 text-primary font-bold bg-transparent w-full max-w-xs"
          onPress={() => navigate('/record/withdraw')}
        >
          {t('withdraw.label.viewRecords')}
        </Button>
      </div>
    </div>
  )
}

export default WithdrawSuccessPage
