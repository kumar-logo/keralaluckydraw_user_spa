import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ScrollShadow, Button, Image } from '@nextui-org/react'
import { Section, ActionButton, SpriteIcon, TaskRow, CURRENCY_SYMBOL, ClaimHandler } from './earnMoneyShared'
import { DailyTasksActivity } from '../../services/hallApi'

export const DailyTasksSection = ({ data, onClaim, onInvite, onRecharge }: {
  data?: DailyTasksActivity; onClaim: ClaimHandler; onInvite: () => void; onRecharge: () => void
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  if (!data) return null

  const goGame = (tab: number, fallback?: number) => {
    if (typeof fallback === 'number') {
      const channel = localStorage.getItem('channel')
      const specialChannels = 'FB01,FB02,FB03,FB04,FB08,FB10,FB11,FB12,FB16,FB17,FB18,FB19,FB20,FB21,FB22,FB23,FB24,FB25'.split(',')
      if (specialChannels.some(prefix => channel?.startsWith(prefix))) {
        navigate('/index/home?tab=' + fallback)
        return
      }
    }
    navigate('/index/home?tab=' + tab)
  }

  return (
    <Section title={t('earnMoney.label.dailyTasks')} desc={t('earnMoney.desc.dailyTasks')} id="dailyTasks">

      <div className="p-2 mb-5 bg-selected flex items-center rounded-lg relative text-sm">
        <div className="flex-1 text-main flex items-center">
          {t('rebate.completed')}:
          <span className="text-xs ml-1">
            <span className="text-primary">{data?.completed?.value ?? 0}</span>
            /{data?.completed?.totalCount ?? 7}
          </span>
        </div>
        <div className="flex items-center">
          <SpriteIcon pos="goldCoin" className="size-3 mr-1" scale={0.75} />
          <span className="ml-1 mr-2 font-black text-primary din">Extra {CURRENCY_SYMBOL}{data?.completed?.awardNum ?? '??'}</span>
          <ActionButton
            isDisabled={data?.completed?.status !== 2}
            onPress={() => { if (data?.completed) onClaim(data.actID, data.completed.actKey, data.completed.timeKey) }}
            className="h-7 rounded-full min-w-17 bg-primary dark:text-gray text-10! font-bold"
          >
            {t(data?.completed?.status === 3 ? 'common.label.claimed' : data?.completed?.status === 2 ? 'common.label.claim' : 'common.label.inProgress')}
          </ActionButton>
        </div>
        <div className="absolute -bottom-4 left-5 border-[0.5rem] border-transparent border-t-selected" />
      </div>

      <div className="*:mt-3">
        <TaskRow t={t} title="cashReward.label.title" desc={t('earnMoney.desc.cashRain')}
          btnText={data?.cashRain?.status === 0 ? 'common.label.recharge' : 'referral.label.join'}
          bordered={data?.cashRain?.status !== 2} dataAct=""
          onPress={() => { if (data?.cashRain?.status === 2) navigate('/cash-rain'); else onRecharge() }} />

        <TaskRow t={t} title="earnMoney.label.dailyInvite" desc={t('earnMoney.desc.dailyInvite')}
          btnText={data?.userInvite?.status === 3 ? 'common.label.claimed' : data?.userInvite?.status === 2 ? 'common.label.claim' : 'common.label.invite'}
          bordered={data?.userInvite?.status !== 2}
          awardNum={data?.userInvite?.awardNum} awardType={data?.userInvite?.awardType}
          dataAct={data?.userInvite ? `${data.actID}-${data.userInvite.actKey}-${data.userInvite.timeKey}` : ''}
          onPress={() => { if (data?.userInvite?.status === 2) onClaim(data.actID, data.userInvite.actKey, data.userInvite.timeKey); else onInvite() }} />

        <TaskRow t={t} title="earnMoney.label.playLotto"
          desc={t('earnMoney.desc.totalBets', { amount: CURRENCY_SYMBOL + (data?.playLottery?.betCount ?? '??') })}
          status={data?.playLottery?.status} bordered={data?.playLottery?.status !== 2}
          awardNum={data?.playLottery?.awardNum} awardType={data?.playLottery?.awardType}
          dataAct={data?.playLottery ? `${data.actID}-${data.playLottery.actKey}-${data.playLottery.timeKey}` : ''}
          onPress={() => { if (data?.playLottery?.status !== 2) goGame(3, 0); else onClaim(data.actID, data.playLottery.actKey, data.playLottery.timeKey) }} />

        {data.playLottery?.games?.length ? (
          <ScrollShadow orientation="horizontal" size={24} className="flex mt-0!">
            {data.playLottery.games.map((g) => (
              <Button key={g.gameCode} className="w-17 h-auto shrink-0 gap-0 bg-transparent py-1 flex flex-col items-center justify-center"
                onPress={() => navigate(g.link)}>
                <Image src={g.image} className="size-8" removeWrapper />
                <span className="text-10 text-main mt-1.5">{g.gameName}</span>
              </Button>
            ))}
          </ScrollShadow>
        ) : null}

        <TaskRow t={t} title="earnMoney.label.playCasino"
          desc={t('earnMoney.desc.totalBets', { amount: CURRENCY_SYMBOL + (data?.playCasino?.betCount ?? '??') })}
          status={data?.playCasino?.status}
          awardNum={data?.playCasino?.awardNum} awardType={data?.playCasino?.awardType}
          dataAct={data?.playCasino ? `${data.actID}-${data.playCasino.actKey}-${data.playCasino.timeKey}` : ''}
          onPress={() => { if (data?.playCasino?.status !== 2) goGame(1, 2); else onClaim(data.actID, data.playCasino.actKey, data.playCasino.timeKey) }} />

        <TaskRow t={t} title="earnMoney.label.playLive"
          desc={t('earnMoney.desc.totalBets', { amount: CURRENCY_SYMBOL + (data?.playLive?.betCount ?? '??') })}
          status={data?.playLive?.status}
          awardNum={data?.playLive?.awardNum} awardType={data?.playLive?.awardType}
          dataAct={data?.playLive ? `${data.actID}-${data.playLive.actKey}-${data.playLive.timeKey}` : ''}
          onPress={() => { if (data?.playLive?.status !== 2) goGame(5); else onClaim(data.actID, data.playLive.actKey, data.playLive.timeKey) }} />

        <TaskRow t={t} title="earnMoney.label.playFish"
          desc={t('earnMoney.desc.totalBets', { amount: CURRENCY_SYMBOL + (data?.playFishing?.betCount ?? '??') })}
          status={data?.playFishing?.status}
          awardNum={data?.playFishing?.awardNum} awardType={data?.playFishing?.awardType}
          dataAct={data?.playFishing ? `${data.actID}-${data.playFishing.actKey}-${data.playFishing.timeKey}` : ''}
          onPress={() => { if (data?.playFishing?.status !== 2) goGame(4); else onClaim(data.actID, data.playFishing.actKey, data.playFishing.timeKey) }} />

        <TaskRow t={t} title="earnMoney.label.playSlot"
          desc={t('earnMoney.desc.totalBets', { amount: CURRENCY_SYMBOL + (data?.playSlot?.betCount ?? '??') })}
          status={data?.playSlot?.status}
          awardNum={data?.playSlot?.awardNum} awardType={data?.playSlot?.awardType}
          dataAct={data?.playSlot ? `${data.actID}-${data.playSlot.actKey}-${data.playSlot.timeKey}` : ''}
          onPress={() => { if (data?.playSlot?.status !== 2) goGame(2, 3); else onClaim(data.actID, data.playSlot.actKey, data.playSlot.timeKey) }} />
      </div>
    </Section>
  )
}
