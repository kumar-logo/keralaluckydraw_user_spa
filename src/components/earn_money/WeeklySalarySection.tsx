import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { checkAuth } from '../../utils/helpers'
import { Section, ActionButton, SpriteIcon, VipSpriteIcon, CURRENCY_SYMBOL, ClaimHandler } from './earnMoneyShared'
import { WeeklySalaryActivity } from '../../services/hallApi'

export const WeeklySalarySection = ({ data, onClaim }: { data?: WeeklySalaryActivity; onClaim: ClaimHandler }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [vipLevel, btnKey, isBordered, isDisabled, isEligible] = useMemo<[number, string, boolean, boolean, boolean]>(() => {
    const level = data?.info?.lastWeek?.vipLevel ?? 0
    if (!data) return [level, 'common.label.locked', true, true, false]
    let key = '', bordered = true, disabled = true, eligible = false
    if (level && data.info.lastWeek.condAmount > 0) {
      if (data.info.lastWeek.rcAmount >= data.info.lastWeek.condAmount) {
        key = data.info.lastWeek.isClaim ? 'common.label.claimed' : 'common.label.claim'
        bordered = false; eligible = true; disabled = data.info.lastWeek.isClaim
      } else {
        key = 'common.label.notEligible'
      }
    } else {
      key = 'common.label.locked'
    }
    return [level, key, bordered, disabled, eligible]
  }, [data])

  return (
    <Section
      title={t('vip.salary.title')}
      desc={t('earnMoney.desc.setlemetTime')}
      id="weeklySalary"
      rightNode={
        <ActionButton roundedFull bordered className="h-7 text-10! px-3" onPress={() => { if (checkAuth()) navigate('/vip') }}>
          {t('common.label.check')}
        </ActionButton>
      }
    >
      <div className="flex items-center" data-act={data ? `${data.actID}-${data.actKey}-${data.timeKey}` : ''}>
        <div className="flex-1 flex items-center">
          <VipSpriteIcon pos={`v${vipLevel}icon`} className="size-9" />
          <div className="flex flex-col flex-1">
            <p className="text-sm font-black text-main flex items-center">
              VIP{vipLevel}
              <span className={clsx('text-8 font-medium ml-2 rounded-full px-1 leading-3.5', isEligible ? 'text-primary bg-primary/20' : 'text-danger bg-danger/20')}>
                {t('common.label.recharge')}: {CURRENCY_SYMBOL} {data?.info?.lastWeek?.rcAmount ?? '-'} / {CURRENCY_SYMBOL}{data?.info?.lastWeek?.condAmount ?? '-'}
              </span>
            </p>
            <span className="text-10 text-sec">{t('earnMoney.desc.vipLevlLast1')}</span>
          </div>
          <div className="mr-2 flex items-center">
            <SpriteIcon pos="goldCoin" className="size-4 mr-1" />
            <span className="text-primary din font-black text-sm">{CURRENCY_SYMBOL}{data?.info?.lastWeek?.wageAmount || '-'}</span>
          </div>
          <ActionButton
            bordered={isBordered}
            isDisabled={isDisabled}
            roundedFull
            className="text-10! h-7 min-w-17"
            onPress={() => { if (data) { if (isEligible) onClaim(data.actID, data.actKey, data.timeKey); else navigate('/vip') } }}
          >
            {t(btnKey)}
          </ActionButton>
        </div>
      </div>
    </Section>
  )
}
