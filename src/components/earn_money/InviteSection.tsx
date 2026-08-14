import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollShadow, Image } from '@nextui-org/react'
import clsx from 'clsx'
import { resolveAssetUrl } from '../../utils/helpers'
import { Section, ActionButton, SpriteIcon, CURRENCY_SYMBOL, ClaimHandler } from './earnMoneyShared'
import { InviteActivity, InviteEntry } from '../../services/hallApi'

export const InviteSection = ({ data, onClaim, onInvite }: { data?: InviteActivity; onClaim: ClaimHandler; onInvite: () => void }) => {
  const { t } = useTranslation()

  const sorted = useMemo<InviteEntry[]>(() => {
    if (!data?.content?.length) return []
    const claimed = data.content.filter((u) => u.status === 3)
    const claimable = data.content.filter((u) => u.status === 2)
    const rest = data.content.filter((u) => u.status !== 3 && u.status !== 2)
    const top = claimed.length > 0 ? claimed.reduce((a, b) => (b.awardNum ?? 0) > (a.awardNum ?? 0) ? b : a) : null
    const otherClaimed = top ? claimed.filter((u) => u !== top) : []
    claimable.sort((a, b) => (b.awardNum ?? 0) - (a.awardNum ?? 0))
    return [...(top ? [top] : []), ...claimable, ...rest, ...otherClaimed]
  }, [data])

  if (!data?.content?.length) return null

  return (
    <Section
      title={t('earnMoney.label.inviteFriends')}
      desc={t('earnMoney.desc.inviteFriends', { currency: CURRENCY_SYMBOL })}
      ruleRender={
        <div>
          <ul className="list-decimal text-xs pl-4">
            <li>{t('earnMoney.rule.inviteFriends.rule1')}</li>
            <ul className="list-disc mt-1 mb-2 pl-3">
              <li>{t('earnMoney.rule.inviteFriends.rule1desc1')}</li>
              <li>{t('earnMoney.rule.inviteFriends.rule1desc2')}</li>
            </ul>
            <li>{t('earnMoney.rule.inviteFriends.rule2')}</li>
            <ul className="list-disc mt-1 mb-2 pl-3">
              <li>{t('earnMoney.rule.inviteFriends.rule2desc')}</li>
            </ul>
            <li>{t('earnMoney.rule.inviteFriends.rule3')}</li>
            <ul className="list-disc mt-1 mb-2 pl-3">
              <li>{t('earnMoney.rule.inviteFriends.rule3desc1')}</li>
              <li>{t('earnMoney.rule.inviteFriends.rule3desc2')}</li>
            </ul>
            <li>{t('earnMoney.rule.inviteFriends.rule4')}</li>
            <ul className="list-disc mt-1 mb-2 pl-3">
              <li>{t('earnMoney.rule.inviteFriends.rule4desc1')}</li>
              <li>{t('earnMoney.rule.inviteFriends.rule4desc2')}</li>
            </ul>
          </ul>
          <p className="text-xs">{t('earnMoney.rule.inviteFriends.rule5')}</p>
        </div>
      }
      id="invite"
    >
      <ScrollShadow orientation="horizontal" className="flex items-center" size={16}>
        {sorted.map((item, i) => (
          <div key={item.actKey + '' + i} className="not-first:ml-2 flex flex-col items-center" data-act={`${data.actID}-${item.actKey}-${item.timeKey}`}>
            {item.avatar ? (
              <Image src={resolveAssetUrl(item.avatar)} removeWrapper className="size-5 rounded-full" />
            ) : (
              <SpriteIcon pos="avatar" className="size-5" />
            )}
            <div className="flex items-center my-1">
              <SpriteIcon pos="goldCoin" className="size-4 mr-1" />
              <p className="font-black text-primary text-sm din">{CURRENCY_SYMBOL}{item.awardNum || 0}</p>
            </div>
            <ActionButton
              isDisabled={item.status === 3}
              className={clsx('text-10! font-bold rounded-full h-7 px-4.5',
                item.status === 2 || item.status === 3
                  ? 'bg-primary text-main dark:text-gray'
                  : 'border border-primary text-primary'
              )}
              onPress={() => { if (item.status === 2) onClaim(data.actID, item.actKey, item.timeKey); else onInvite() }}
            >
              {t(item.status === 2 ? 'common.label.claim' : item.status === 3 ? 'common.label.claimed' : 'common.label.invite')}
            </ActionButton>
          </div>
        ))}
      </ScrollShadow>
    </Section>
  )
}
