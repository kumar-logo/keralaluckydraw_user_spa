import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ScrollShadow } from '@nextui-org/react'
import { getActivityList, claimActivityAward, ActivityList } from '../services/hallApi'
import { checkAuth } from '../utils/helpers'
import { toast } from '../utils/toast'
import { fetchAndSyncBalance } from '../utils/fetchBalance'
import { useNotificationStore } from '../stores/notificationStore'
import { useAppConfigStore } from '../stores/configStore'
import { TopBar } from '../components/shared/TopBar'
import { Spin } from '../components/shared/Spin'
import { AlmsSection } from '../components/earn_money/AlmsSection'
import { DepositSection } from '../components/earn_money/DepositSection'
import { FirstWithdrawalSection } from '../components/earn_money/FirstWithdrawalSection'
import { RebateSection } from '../components/earn_money/RebateSection'
import { WinLoseSection } from '../components/earn_money/WinLoseSection'
import { InviteSection } from '../components/earn_money/InviteSection'
import { DailyRewardsSection } from '../components/earn_money/DailyRewardsSection'
import { DailyTasksSection } from '../components/earn_money/DailyTasksSection'
import { WeeklySalarySection } from '../components/earn_money/WeeklySalarySection'
import { RankingSection } from '../components/earn_money/RankingSection'
import { OneTimeSection } from '../components/earn_money/OneTimeSection'

export const EarnMoneyPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ActivityList | null>(null)
  const initNotifications = useNotificationStore((s) => s.init)
  const vipEnabled = useAppConfigStore((s) => s.vipEnabled)

  const fetchData = useCallback(() => {
    return getActivityList()
      .then((res) => setData(() => res))
      .finally(() => initNotifications())
  }, [initNotifications])

  useEffect(() => {
    setLoading(true)
    fetchData().finally(() => setLoading(false))

    const handler = () => fetchData()
    window.addEventListener('updateEarnMoneyList', handler)
    window.addEventListener('resolvedDownloadBonus', handler)
    return () => {
      window.removeEventListener('updateEarnMoneyList', handler)
      window.removeEventListener('resolvedDownloadBonus', handler)
    }
  }, [fetchData])

  useEffect(() => {
    setTimeout(() => {
      const actID = searchParams.get('actID')
      const actKey = searchParams.get('actKey')
      const timeKey = searchParams.get('timeKey')
      if (actID && actKey && timeKey) {
        const el = document.querySelector(`[data-act='${actID}-${actKey}-${timeKey}']`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setTimeout(() => {
            el.classList.add('animate-invert-flash')
            setTimeout(() => {
              el.classList.remove('animate-invert-flash')
              const params = new URLSearchParams(searchParams)
              params.delete('actID'); params.delete('actKey'); params.delete('timeKey')
              setSearchParams(params, { replace: true })
            }, 1000)
          }, 500)
        }
      }
    }, 16)
  }, [searchParams, data, setSearchParams])

  const handleClaim = useCallback((actID: number, actKey: string, timeKey: string) => {
    if (!checkAuth()) return
    claimActivityAward(actID, actKey, timeKey).then(() => {
      toast.success(t('common.tip.success.claim'))
      fetchAndSyncBalance()
      fetchData()
    }).catch(() => {})
  }, [fetchData, t])

  const handleInvite = useCallback(() => {
    if (!checkAuth()) return
    navigate('/agent')
  }, [navigate])

  const handleRecharge = useCallback(() => {
    navigate('/recharge')
  }, [navigate])

  return (
    <div
      className="size-full flex flex-col bg-no-repeat bg-cover pb-14"
      style={{ backgroundImage: 'url(/images/earn-money/earn-money-bg.webp)' }}
    >
      <TopBar title="Earn Money" hideBack background="#0000" boxShadow="none" />

      <Spin loading={loading} className="flex-1 overflow-hidden">
        <ScrollShadow className="size-full p-3 pb-8 *:not-first:mt-3" size={24}>
          {(data?.alms?.content?.length ?? 0) > 0 && (
            <AlmsSection data={data?.alms} onClaim={handleClaim} />
          )}
          {data?.deposit && (
            <DepositSection data={data.deposit} onClaim={handleClaim} onRecharge={handleRecharge} />
          )}
          {vipEnabled && data?.firstWithdrawal && (
            <FirstWithdrawalSection data={data.firstWithdrawal} onClaim={handleClaim} />
          )}
          <RebateSection data={data?.rebate} onClaim={handleClaim} />
          <WinLoseSection data={data?.winLose} onClaim={handleClaim} />
          <InviteSection data={data?.invite} onClaim={handleClaim} onInvite={handleInvite} />
          <DailyRewardsSection data={data?.dailyRewards} onClaim={handleClaim} />
          <DailyTasksSection data={data?.dailyTasks} onClaim={handleClaim} onInvite={handleInvite} onRecharge={() => handleRecharge()} />
          {vipEnabled && <WeeklySalarySection data={data?.weeklySalary} onClaim={handleClaim} />}
          <RankingSection data={data?.ranking} onClaim={handleClaim} />
          {data?.onetime && (
            <OneTimeSection data={data.onetime} onClaim={handleClaim} />
          )}
        </ScrollShadow>
      </Spin>
    </div>
  )
}

export default EarnMoneyPage
