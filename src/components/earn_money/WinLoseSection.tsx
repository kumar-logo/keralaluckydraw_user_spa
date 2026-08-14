import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Section, ActionButton, SpriteIcon, NotificationDot, CURRENCY_SYMBOL, ClaimHandler } from './earnMoneyShared'
import { WinLoseActivity } from '../../services/hallApi'

export const WinLoseSection = ({ data, onClaim }: { data?: WinLoseActivity; onClaim: ClaimHandler }) => {
  const { t } = useTranslation()

  return (
    <Section
      title={t('earnMoney.label.losRefund')}
      desc={t('earnMoney.desc.betComp')}
      id="EarnMoneyBetComp"
      ruleRender={
        <div>
          <ul className="list-decimal text-xs pl-4">
            <li>{t('earnMoney.rule.loseRefound.rule1')}</li>
            <ul className="list-disc mt-1 mb-2 pl-3">
              <li>{t('earnMoney.rule.loseRefound.rule1desc1')}</li>
              <li>{t('earnMoney.rule.loseRefound.rule1desc2')}</li>
              <li>{t('earnMoney.rule.loseRefound.rule1desc3')}</li>
              <li>{t('earnMoney.rule.loseRefound.rule1desc4')}</li>
            </ul>
            <li>{t('earnMoney.rule.loseRefound.rule2')}</li>
            <ul className="list-disc mt-1 mb-2 pl-3">
              <li>{t('earnMoney.rule.loseRefound.rule2desc1')}</li>
              <li>{t('earnMoney.rule.loseRefound.rule2desc2')}</li>
            </ul>
            <li>{t('earnMoney.rule.loseRefound.rule3')}</li>
            <ul className="list-disc mt-1 mb-2 pl-3">
              <li>{t('earnMoney.rule.loseRefound.rule3desc1')}</li>
              <li>{t('earnMoney.rule.loseRefound.rule3desc2')}</li>
            </ul>
            <li>{t('earnMoney.rule.importantNotes')}</li>
            <ul className="list-disc mt-1 mb-2 pl-3">
              <li>{t('earnMoney.rule.loseRefound.rule4desc1')}</li>
            </ul>
          </ul>
          <p className="text-xs">{t('earnMoney.rule.inviteFriends.rule5')}</p>
        </div>
      }
    >
      <div className="flex items-center" data-act={`${data?.actID}-${data?.actKey}-${data?.timeKey}`}>
        <div className="flex-1 flex h-9">
          <div className="flex flex-col justify-between">
            <p className="text-10 leading-3.5 text-sec">{t('earnMoney.label.loseAmount')}</p>
            <div className="flex items-center h-4.5">
              <p className="text-main font-sm font-black din mr-1">{CURRENCY_SYMBOL}{data?.winLose}</p>
            </div>
          </div>
          <div className="flex items-end font-black text-main mx-1">
            <div className="h-4.5 flex items-center">×</div>
          </div>
          <div className="px-1 flex flex-col justify-between text-primary">
            <div className="text-8 leading-3.5">{t('earnMoney.label.compRate')}</div>
            <div className="flex items-center text-10 h-4.5 font-black din">??%</div>
          </div>
        </div>
        <div className={clsx('mr-2 flex items-center duration-500', data?.award ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0')}>
          <SpriteIcon pos="goldCoin" className="size-4 mr-1" />
          <span className="text-primary din font-black text-sm">{CURRENCY_SYMBOL}{data?.award || '-'}</span>
        </div>
        <ActionButton
          isDisabled={data?.status !== 2}
          className="h-7 text-10! px-2 min-w-17 relative overflow-visible"
          roundedFull
          onPress={() => { if (data?.status === 2) onClaim(data.actID, data.actKey, data.timeKey) }}
        >
          {data?.status === 2 && <NotificationDot ping wapperClassName="absolute! right-0 top-0" />}
          {t(data?.status === 3 ? 'common.label.claimed' : data?.status === 2 ? 'common.label.claim' : 'common.label.notEligible')}
        </ActionButton>
      </div>
    </Section>
  )
}
