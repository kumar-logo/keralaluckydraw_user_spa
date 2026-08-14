import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { checkAuth } from '../../utils/helpers'
import { Section, ActionButton, SpriteIcon, VipSpriteIcon, AwardDisplay, ClaimHandler } from './earnMoneyShared'
import { DailyRewardsActivity } from '../../services/hallApi'

type DailyRewardKey = 'checkin' | 'spin' | 'betCompensation' | 'rebate'

const dailyRewardsConfig: { key: DailyRewardKey; descKey: string; titleKey: string; scrollTo: string; icon: string }[] = [
  { key: 'checkin', descKey: 'earnMoney.desc.checkIn', titleKey: 'earnMoney.label.checkIn', scrollTo: '', icon: 'checkin' },
  { key: 'spin', descKey: 'earnMoney.desc.spin', titleKey: 'luckyspin.label.title', scrollTo: '', icon: 'spin' },
  { key: 'betCompensation', descKey: 'earnMoney.desc.dailyBetComp', titleKey: 'earnMoney.label.betComp', scrollTo: 'EarnMoneyBetComp', icon: 'insurance' },
  { key: 'rebate', descKey: 'earnMoney.desc.dailyRebate', titleKey: 'earnMoney.label.rebate', scrollTo: 'EarnMoneyRebate', icon: 'wallet' },
]

export const DailyRewardsSection = ({ data, onClaim }: { data?: DailyRewardsActivity; onClaim: ClaimHandler }) => {
  const { t } = useTranslation()
  if (!data) return null

  return (
    <Section
      title={t('earnMoney.label.daily')}
      desc={t('earnMoney.desc.daily')}
      id="dailyRewards"
      ruleRender={
        <div>
          <ul className="list-decimal text-xs pl-4">
            <li>{t('earnMoney.rule.dailyRewards.rule1')}</li>
            <ul className="list-disc mt-1 mb-2 pl-3"><li>{t('earnMoney.rule.dailyRewards.rule1desc')}</li></ul>
            <li>{t('earnMoney.rule.dailyRewards.rule2')}</li>
            <ul className="list-disc mt-1 mb-2 pl-3"><li>{t('earnMoney.rule.dailyRewards.rule2desc')}</li></ul>
            <li>{t('earnMoney.rule.dailyRewards.rule3')}</li>
            <ul className="list-disc mt-1 mb-2 pl-3">
              <li>{t('earnMoney.rule.dailyRewards.rule3desc1')}</li>
              <li>{t('earnMoney.rule.dailyRewards.rule3desc2')}</li>
            </ul>
            <li>{t('earnMoney.rule.importantNotes')}</li>
            <ul className="list-disc mt-1 mb-2 pl-3">
              <li>{t('earnMoney.rule.dailyRewards.rule4desc1')}</li>
              <li>{t('earnMoney.rule.dailyRewards.rule4desc2')}</li>
            </ul>
          </ul>
          <p className="text-xs">{t('earnMoney.rule.inviteFriends.rule5')}</p>
        </div>
      }
    >
      <div>
        {dailyRewardsConfig.map((cfg) => {
          const val = data?.[cfg.key]
          return (
            <div key={cfg.key} className="not-first:mt-2 flex items-center h-12">
              <div className="flex-1 flex items-center overflow-hidden">
                {cfg.icon === 'spin' ? (
                  <VipSpriteIcon pos="spinIcon" className="size-6" />
                ) : (
                  <SpriteIcon pos={cfg.icon} className="size-6" />
                )}
                <div className="ml-2">
                  <div className="text-xs flex items-center font-bold">
                    <p className="mr-1 text-main">{t(cfg.titleKey)}</p>
                    {val && <AwardDisplay type={val.awardType} num={val.awardNum} />}
                  </div>
                  <div className="text-10 pr-3">{t(cfg.descKey)}</div>
                </div>
              </div>
              {val && (
                <ActionButton
                  isDisabled={val.status !== 2 && !cfg.scrollTo}
                  onPress={() => {
                    if (!checkAuth()) return
                    if (val.status === 2) {
                      onClaim(data.actID, val.actKey, val.timeKey)
                    } else if (cfg.scrollTo) {
                      document.getElementById(cfg.scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }}
                  className={clsx('h-7 min-w-17 rounded-full font-bold text-10!',
                    val.status === 2 || !cfg.scrollTo ? 'bg-primary dark:text-gray' : 'text-primary border border-primary'
                  )}
                >
                  {t(val.status === 2 ? 'common.label.claim' : cfg.scrollTo ? 'common.label.check' : 'common.label.claimed')}
                </ActionButton>
              )}
            </div>
          )
        })}
      </div>
    </Section>
  )
}
