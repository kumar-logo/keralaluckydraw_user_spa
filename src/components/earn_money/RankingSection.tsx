import { useTranslation } from 'react-i18next'
import { Image } from '@nextui-org/react'
import clsx from 'clsx'
import { formatCurrency } from '../../utils/format'
import { resolveAvatarUrl } from '../../utils/helpers'
import { Section, ActionButton, SpriteIcon, AwardDisplay, ClaimHandler } from './earnMoneyShared'
import { RankingActivity, RankTop } from '../../services/hallApi'

const RankCard = ({ item, className, amountClassName, icon }: {
  item?: RankTop; className?: string; amountClassName?: string; icon?: React.ReactNode
}) => (
  <div className={clsx('rounded flex items-center justify-between px-2 py-1', className)}>
    <Image removeWrapper src={resolveAvatarUrl(item?.avatar)} radius="full" className="size-6 border border-white" />
    <div className="flex flex-col">
      <div className="text-white/60 text-10 font-bold">Bonus</div>
      <div className={clsx('text-xs font-black din', amountClassName)}>
        {item?.awards?.[0]?.awardNumber ? formatCurrency(item.awards[0].awardNumber, 0) : '-'}
      </div>
    </div>
    {icon}
  </div>
)

export const RankingSection = ({ data, onClaim }: { data?: RankingActivity; onClaim: ClaimHandler }) => {
  const { t } = useTranslation()
  if (!data?.info?.[1]) return null
  const rankData = data.info[1]

  return (
    <Section
      title={t('earnMoney.label.rankingCashAwards')}
      desc={t('earnMoney.desc.setlemetTime')}
      id="ranking"
      rightNode={
        <ActionButton bordered roundedFull className="h-7 px-3 text-10!">
          {t('common.label.viewAll')}
        </ActionButton>
      }
    >
      <div className="grid grid-cols-3 gap-x-2" data-act={data ? `${data.actID}-${rankData.actKey}-${rankData.timeKey}` : ''}>
        <RankCard
          className="bg-[#686100]" amountClassName="text-[#FFF022]"
          item={rankData?.tops?.[0]}
          icon={<SpriteIcon pos="rank1st" className="size-4" />}
        />
        <RankCard
          className="bg-[#6F2600]" amountClassName="text-[#FF732A]"
          item={rankData?.tops?.[1]}
          icon={<SpriteIcon pos="rank2nd" className="size-4" />}
        />
        <RankCard
          className="bg-[#135B71]" amountClassName="text-[#19C9FF]"
          item={rankData?.tops?.[2]}
          icon={<SpriteIcon pos="rank3rd" className="size-4" />}
        />
      </div>

      <div className="flex items-center mt-2">
        <div className="flex-1 flex flex-col">
          <p className="text-10">{t('earnMoney.desc.yourLastWeekRanking')}</p>
          {rankData.me?.stage ? (
            <p className="text-2xl text-white din">{rankData.me.stage}</p>
          ) : (
            <p className="text-sm">{t('earnMoney.desc.didNotRank')}</p>
          )}
        </div>
        {rankData.me?.awards?.[0]?.awardNumber ? (
          <AwardDisplay type="chip" num={formatCurrency({ amount: rankData.me.awards[0].awardNumber, precision: 0, hideSymbol: true })} />
        ) : null}
        <ActionButton
          roundedFull
          isDisabled={!rankData.me?.stage || !rankData.me?.isClaim}
          className="text-10! h-7 px-3 ml-2"
          onClick={() => { if (rankData.me?.stage) onClaim(data.actID, rankData.actKey, rankData.timeKey) }}
        >
          {t(rankData.me?.stage ? (rankData.me.isClaim ? 'common.label.claim' : 'common.label.claimed') : 'common.label.claim')}
        </ActionButton>
      </div>
    </Section>
  )
}
