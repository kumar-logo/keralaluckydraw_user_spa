import { useTranslation } from 'react-i18next'
import { Section, ActionButton, SpriteIcon, VipSpriteIcon, CURRENCY_SYMBOL, ClaimHandler } from './earnMoneyShared'
import { FirstWithdrawalActivity } from '../../services/hallApi'

export const FirstWithdrawalSection = ({ data, onClaim }: { data?: FirstWithdrawalActivity; onClaim: ClaimHandler }) => {
  const { t } = useTranslation()
  if (!data) return null
  return (
    <Section title={t('earnMoney.label.firstWithdrawal')} desc={t('earnMoney.desc.firstWithdrawal')} id="firstWithdrawal">
      <div className="flex items-center" data-act={`${data.actID}-${data.actKey}-${data.timeKey}`}>
        <div className="flex-1 flex items-center">
          <VipSpriteIcon pos="v3icon" className="size-9 mr-2" />
          <div>
            <div className="text-main text-sm font-black leading-4">VIP{data.vipLevel}</div>
            <div className="text-xs font-black text-primary flex items-center mt-1 din">
              <SpriteIcon pos="goldCoin" className="size-3 mr-1" scale={0.75} />
              {CURRENCY_SYMBOL}{data.awardNum}
            </div>
          </div>
        </div>
        <ActionButton
          className="rounded-full min-w-20 font-bold bg-primary text-black h-7 text-10!"
          isDisabled={data.status !== 2 || data.vipLevel === 0}
          onPress={() => { if (data.status === 2) onClaim(data.actID, data.actKey, data.timeKey) }}
        >
          {t(data.vipLevel === 0 ? 'common.label.locked' : data.status === 2 ? 'common.label.claimNow' : 'common.label.inProgress')}
        </ActionButton>
      </div>
    </Section>
  )
}
