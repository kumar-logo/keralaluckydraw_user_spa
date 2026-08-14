import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Progress, ScrollShadow } from '@nextui-org/react'
import { getVipPanel, claimVipAward, claimVipMonthly } from '../services/financeApi'
import { formatCurrency } from '../utils/format'
import { toast } from '../utils/toast'
import { withLoading } from '../utils/helpers'
import { TopBar } from '../components/shared/TopBar'
import { Spin } from '../components/shared/Spin'
import { NoData } from '../components/shared/NoData'
import { useAppConfigStore } from '../stores/configStore'

interface VipLevel {
  level: number
  name: string
  requiredBet: number
  requiredRecharge: number
  upgradeBonus: number
  monthlyBonus: number
  rebateRate: number
  withdrawLimit: number
  levelColor?: string
}

interface VipInfo {
  currentLevel: number
  currentBet: number
  currentRecharge: number
  nextLevelBet: number
  nextLevelRecharge: number
  levels: VipLevel[]
  claimedLevels: number[]
  monthlyClaimedLevels: number[]
}

const EMPTY_VIP_INFO: VipInfo = {
  currentLevel: 0,
  currentBet: 0,
  currentRecharge: 0,
  nextLevelBet: 0,
  nextLevelRecharge: 0,
  levels: [],
  claimedLevels: [],
  monthlyClaimedLevels: [],
}

export const VipPage = () => {
  const { t } = useTranslation()
  const vipEnabled = useAppConfigStore((s) => s.vipEnabled)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [info, setInfo] = useState<VipInfo>(EMPTY_VIP_INFO)

  const loadData = () => {
    withLoading(setLoading, getVipPanel().then((data) => {
      setInfo({
        currentLevel: data.currentLevel ?? data.vipLevel ?? 0,
        currentBet: data.currentBet ?? data.totalBet ?? 0,
        currentRecharge: data.currentRecharge ?? data.totalRecharge ?? 0,
        nextLevelBet: data.nextLevelBet ?? data.nextBet ?? 0,
        nextLevelRecharge: data.nextLevelRecharge ?? data.nextRecharge ?? 0,
        levels: data.levels ?? data.vipList ?? [],
        claimedLevels: data.claimedLevels ?? data.receivedList ?? [],
        monthlyClaimedLevels: data.monthlyClaimedLevels ?? [],
      })
    }))
  }

  useEffect(() => { loadData() }, [])

  const handleClaim = (level: number) => {
    withLoading(setClaiming, claimVipAward(level).then(() => {
      toast.success(t('common.tip.success.claim'))
      loadData()
    }))
  }

  const handleClaimMonthly = (level: number) => {
    withLoading(setClaiming, claimVipMonthly(level).then(() => {
      toast.success(t('common.tip.success.claim'))
      loadData()
    }))
  }

  const betProgress = info.nextLevelBet > 0
    ? Math.min((info.currentBet / info.nextLevelBet) * 100, 100)
    : 0

  const rechargeProgress = info.nextLevelRecharge > 0
    ? Math.min((info.currentRecharge / info.nextLevelRecharge) * 100, 100)
    : 0

  if (!vipEnabled) {
    return (
      <div className="flex flex-col size-full bg-[#1F3E55]">
        <TopBar title={t('common.label.vip')} />
        <div className="flex-1 flex items-center justify-center min-h-0">
          <NoData />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col size-full bg-[#1F3E55]">
      <TopBar title={t('common.label.vip')} />

      <Spin className="flex-1 flex flex-col min-h-0" loading={loading}>
        <ScrollShadow className="flex-1 min-h-0 overflow-y-auto p-3">

          <div className="p-4 bg-white dark:bg-gray rounded-xl mb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-lg font-black text-primary">{info.currentLevel}</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-main">VIP {info.currentLevel}</div>
                  <div className="text-xs text-acc">{t('vip.label.currentLevel')}</div>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-acc">{t('vip.label.betProgress')}</span>
                <span className="text-primary font-bold">{betProgress.toFixed(1)}%</span>
              </div>
              <Progress
                value={betProgress}
                classNames={{ indicator: 'bg-primary', track: 'bg-selected' }}
              />
              <div className="text-[10px] text-acc mt-1">
                {formatCurrency(info.currentBet, 0)} / {formatCurrency(info.nextLevelBet, 0)}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-acc">{t('vip.label.rechargeProgress')}</span>
                <span className="text-primary font-bold">{rechargeProgress.toFixed(1)}%</span>
              </div>
              <Progress
                value={rechargeProgress}
                classNames={{ indicator: 'bg-[#1776FF]', track: 'bg-selected' }}
              />
              <div className="text-[10px] text-acc mt-1">
                {formatCurrency(info.currentRecharge, 0)} / {formatCurrency(info.nextLevelRecharge, 0)}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray rounded-xl overflow-hidden mb-3">
            <div className="px-4 py-3 border-b border-selected">
              <span className="text-sm font-bold text-main">{t('vip.label.benefits')}</span>
            </div>

            <div className="grid grid-cols-5 gap-1 px-3 py-2 text-[10px] font-bold text-acc border-b border-selected">
              <span>{t('vip.table.level')}</span>
              <span>{t('vip.table.upgrade')}</span>
              <span>{t('vip.table.monthly')}</span>
              <span>{t('vip.table.rebate')}</span>
              <span>{t('vip.table.action')}</span>
            </div>

            {info.levels.map((level) => {
              const isCurrent = level.level === info.currentLevel
              const isClaimed = info.claimedLevels.includes(level.level)
              const reached = level.level >= 1 && level.level <= info.currentLevel
              const canClaim = reached && !isClaimed
              const monthlyClaimed = info.monthlyClaimedLevels.includes(level.level)
              const monthlyCanClaim = reached && level.monthlyBonus > 0 && !monthlyClaimed

              return (
                <div
                  key={level.level}
                  className={`grid grid-cols-5 gap-1 px-3 py-2.5 text-xs items-center border-b border-selected last:border-b-0 ${
                    isCurrent ? 'bg-primary/5' : ''
                  }`}
                >
                  <span
                    className={`font-bold ${level.levelColor ? '' : isCurrent ? 'text-primary' : 'text-main'}`}
                    style={level.levelColor ? { color: level.levelColor } : undefined}
                  >
                    VIP{level.level}
                  </span>
                  <span className="text-main">{formatCurrency(level.upgradeBonus, 0)}</span>
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-main">{formatCurrency(level.monthlyBonus, 0)}</span>
                    {monthlyCanClaim ? (
                      <button
                        disabled={claiming}
                        className="text-[9px] text-primary font-bold underline disabled:opacity-50"
                        onClick={() => handleClaimMonthly(level.level)}
                      >
                        {t('vip.label.claim')}
                      </button>
                    ) : monthlyClaimed ? (
                      <span className="text-[9px] text-[#009919] font-bold">{t('vip.label.claimed')}</span>
                    ) : null}
                  </div>
                  <span className="text-main">{level.rebateRate}%</span>
                  <div>
                    {canClaim ? (
                      <Button
                        size="sm"
                        isLoading={claiming}
                        className="h-6 min-w-12 text-[10px] bg-primary text-black font-bold rounded-full px-2"
                        onPress={() => handleClaim(level.level)}
                      >
                        {t('vip.label.claim')}
                      </Button>
                    ) : isClaimed ? (
                      <span className="text-[10px] text-[#009919] font-bold">{t('vip.label.claimed')}</span>
                    ) : (
                      <span className="text-[10px] text-acc">--</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="p-4 bg-white dark:bg-gray rounded-xl">
            <div className="text-sm font-bold text-main mb-2">{t('vip.label.requirements')}</div>
            <div className="space-y-2 text-xs text-acc">
              <p>{t('vip.rule.desc1')}</p>
              <p>{t('vip.rule.desc2')}</p>
              <p>{t('vip.rule.desc3')}</p>
            </div>
          </div>
        </ScrollShadow>
      </Spin>
    </div>
  )
}

export default VipPage
