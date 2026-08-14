import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Progress, ScrollShadow } from '@nextui-org/react'
import { useAuthStore } from '../stores/authStore'
import { getUserWallet } from '../services/userApi'
import { formatCurrency } from '../utils/format'
import { withLoading } from '../utils/helpers'
import { TopBar } from '../components/shared/TopBar'
import { Spin } from '../components/shared/Spin'

interface BonusInfo {
  bonusBalance: number
  wageringRequired: number
  wageringCompleted: number
  bonusRules: string[]
}

export const BonusPage = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [info, setInfo] = useState<BonusInfo | null>(null)
  const bonusBalance = useAuthStore((s) => s.bonusBalance)

  useEffect(() => {
    withLoading(setLoading, getUserWallet().then((data) => {
      setInfo({
        bonusBalance: data.bonusBalance ?? 0,
        wageringRequired: data.wageringRequired ?? 0,
        wageringCompleted: data.wageringCompleted ?? 0,
        bonusRules: data.bonusRules ?? [],
      })
    }))
  }, [])

  const wagerProgress = info && info.wageringRequired > 0
    ? Math.min((info.wageringCompleted / info.wageringRequired) * 100, 100)
    : 0

  return (
    <div className="size-full flex flex-col">
      <TopBar title={t('common.label.bonus')} />

      <Spin className="flex-1 flex flex-col" loading={loading}>
        <ScrollShadow className="flex-1 p-2">

          <div className="p-4 bg-white dark:bg-gray rounded-lg mb-2">
            <div className="text-xs text-acc">{t('bonus.label.bonusBalance')}</div>
            <div className="text-2xl font-black text-primary mt-1">
              {formatCurrency(info?.bonusBalance || bonusBalance)}
            </div>
          </div>

          {info && info.wageringRequired > 0 && (
            <div className="p-4 bg-white dark:bg-gray rounded-lg mb-2">
              <div className="text-sm font-bold text-main mb-2">
                {t('bonus.label.wageringProgress')}
              </div>
              <Progress
                value={wagerProgress}
                className="mb-2"
                classNames={{
                  indicator: 'bg-primary',
                  track: 'bg-selected',
                }}
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-acc">
                  {formatCurrency(info.wageringCompleted, 0)} / {formatCurrency(info.wageringRequired, 0)}
                </span>
                <span className="text-primary font-bold">{wagerProgress.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-acc mt-2">
                {t('bonus.tip.wageringDesc')}
              </p>
            </div>
          )}

          <div className="p-4 bg-white dark:bg-gray rounded-lg">
            <div className="text-sm font-bold text-main mb-2">
              {t('bonus.label.rules')}
            </div>
            <div className="space-y-2 text-xs text-acc">
              {info?.bonusRules && info.bonusRules.length > 0 ? (
                info.bonusRules.map((rule, idx) => (
                  <p key={idx}>{idx + 1}. {rule}</p>
                ))
              ) : (
                <>
                  <p>{t('bonus.rule.desc1')}</p>
                  <p>{t('bonus.rule.desc2')}</p>
                  <p>{t('bonus.rule.desc3')}</p>
                </>
              )}
            </div>
          </div>
        </ScrollShadow>
      </Spin>
    </div>
  )
}

export default BonusPage
