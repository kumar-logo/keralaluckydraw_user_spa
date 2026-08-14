import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Button } from '@nextui-org/react'
import { BetType, getRunnerState, getRaceStateNames, RaceRunner } from '../../config/raceConstants'
import type { RaceGameInfoDto } from '../../services/raceApi'
import { PlayerBadge, GroupBadge, RankBadge, ChampionIcon, TeamIcon, Top3Icon } from './Badges'

const BetButton = ({ children, onPress, isActive, disableAnimation, className, isDisabled }: {
  children: React.ReactNode; onPress?: (e: any) => void; isActive?: boolean; disableAnimation?: boolean; className?: string; isDisabled?: boolean
}) => (
  <Button
    onPress={onPress}
    isDisabled={isDisabled}
    disableAnimation={disableAnimation}
    className={clsx('flex items-center justify-start rounded-lg gap-0 bg-selected h-9! px-1', isActive && 'bg-primary text-gray!', className)}
    style={{ boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.08)' }}
  >
    {children}
  </Button>
)

const RunnerButton = ({ no, onPress, isActive, single, raceRunners, isDisabled }: { no: number; onPress?: (e: any) => void; isActive?: boolean; single: boolean; raceRunners?: RaceRunner[] | null; isDisabled?: boolean }) => (
  <BetButton onPress={onPress} isActive={isActive} isDisabled={isDisabled}>
    <PlayerBadge state={getRunnerState(no, single)} raceRunners={raceRunners} />
    <span className={'text-sm font-bold ml-1 ' + (isActive ? 'text-gray' : 'text-main')}>{no}</span>
  </BetButton>
)

const GroupButton = ({ state, onPress, name, total, isDisabled }: { state: number; onPress?: (e: any) => void; name: string; total: number; isDisabled?: boolean }) => (
  <BetButton onPress={onPress} isDisabled={isDisabled}>
    <GroupBadge state={state} />
    <div className="ml-1 flex flex-col">
      <span className="text-xs font-bold text-main">{name}</span>
      <div className="flex items-center">
        <span className="text-8 text-acc mr-1">Win</span>
        <span className="text-10 font-bold text-primary">{total}</span>
      </div>
    </div>
  </BetButton>
)

const RankSlot = ({ no, rank, single, raceRunners }: { no: number; rank: number; single: boolean; raceRunners?: RaceRunner[] | null }) => (
  <BetButton className="border-2 border-gray dark:border-text-sec" disableAnimation>
    <RankBadge no={rank} />
    <div className="w-2" />
    {no ? (
      <PlayerBadge state={getRunnerState(no, single)} raceRunners={raceRunners} />
    ) : (
      <div className="border-2 border-dashed border-acc size-5.5 rounded-full flex items-center justify-center">?</div>
    )}
    <div className="ml-1 font-bold text-sm text-main">{no || '-'}</div>
  </BetButton>
)

const BetSection = ({ icon, children, title, odd }: { icon: React.ReactNode; children: React.ReactNode; title: string; odd: number }) => {
  if (!odd) return <></>
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {icon}
          <span className="ml-2 font-bold text-main text-sm">{title}</span>
        </div>
        <div className="rounded bg-primary/20 dark:bg-charcoal text-[#009048] dark:text-primary h-6 px-3 text-xs leading-6 font-bold">
          @{odd.toFixed(2)}x
        </div>
      </div>
      {children}
    </div>
  )
}

const Top3Picker = ({ runnerCountList, onAdd, type, single, raceRunners, canBetting }: {
  runnerCountList: number[]; onAdd: (state: number, no: number[], type: number, target: HTMLElement | null) => void; type: number; single: boolean; raceRunners?: RaceRunner[] | null; canBetting: boolean
}) => {
  const { t } = useTranslation()
  const [selectedRunners, setSelectedRunners] = useState<number[]>([])

  return (
    <>
      <div className="grid grid-cols-6 gap-x-1 gap-y-2 py-2">
        {runnerCountList.map((runnerNo) => (
          <RunnerButton
            key={runnerNo}
            single={single}
            raceRunners={raceRunners}
            isDisabled={!canBetting}
            isActive={selectedRunners.includes(runnerNo)}
            no={runnerNo}
            onPress={() => {
              const existingIdx = selectedRunners.findIndex((num) => num === runnerNo)
              if (existingIdx > -1) {
                setSelectedRunners((prev) => { prev.splice(existingIdx, 1); return [...prev] })
              } else {
                setSelectedRunners((prev) => { prev.push(runnerNo); if (prev.length > 3) prev.shift(); return [...prev] })
              }
            }}
          />
        ))}
      </div>
      <div className="flex items-center mb-3">
        <div className="flex-1 grid grid-cols-3 gap-1 mr-3">
          <RankSlot single={single} no={selectedRunners[0]} rank={0} raceRunners={raceRunners} />
          <RankSlot single={single} no={selectedRunners[1]} rank={1} raceRunners={raceRunners} />
          <RankSlot single={single} no={selectedRunners[2]} rank={2} raceRunners={raceRunners} />
        </div>
        <Button
          className="bg-primary text-black font-bold w-16 h-9"
          isDisabled={!canBetting || selectedRunners.length !== 3}
          onPress={(event: any) => { onAdd(0, [...selectedRunners], type, event.target) }}
        >
          {t('common.label.bet')}
        </Button>
      </div>
    </>
  )
}

export const RaceBettingPanel = ({ gameInfo, onAdd, gameTypeMap, runnerCountList, single, raceRunners, canBetting = true }: {
  gameInfo?: RaceGameInfoDto
  onAdd: (state: number, no: number[], type: number, target: HTMLElement | null) => void
  gameTypeMap: Record<number, number>
  canBetting?: boolean
  runnerCountList: number[]
  single: boolean
  raceRunners?: RaceRunner[] | null
}) => {
  const { t } = useTranslation()
  const stateNamesDyn = getRaceStateNames(runnerCountList.length, raceRunners)
  const groupTotals = useMemo<Record<number, number> | null>(() => {
    const top1 = gameInfo?.last100Top1
    if (!top1) return null
    return Array.from({ length: 6 }, (_, stateIdx) =>
      (top1[stateIdx * 2 + 1] || 0) + (top1[stateIdx * 2 + 2] || 0)
    ).reduce<Record<number, number>>((acc, total, idx) => { acc[idx] = total; return acc }, {})
  }, [gameInfo])

  return (
    <div className="p-3 pb-0">
      <BetSection icon={<ChampionIcon />} title={t('race.label.1stBet')} odd={gameTypeMap[BetType.Champion]}>
        <div className="grid grid-cols-6 gap-x-1 gap-y-2 pt-2 pb-4">
          {runnerCountList.map((runnerNo) => (
            <RunnerButton
              key={runnerNo}
              no={runnerNo}
              single={single}
              raceRunners={raceRunners}
              isDisabled={!canBetting}
              onPress={(event: any) => { onAdd(getRunnerState(runnerNo, single), [runnerNo], BetType.Champion, event.target) }}
            />
          ))}
        </div>
      </BetSection>

      <BetSection icon={<TeamIcon />} title={t('race.label.team1stBet')} odd={gameTypeMap[BetType.WinningGroup]}>
        <div className="grid grid-cols-2 gap-2 pt-2 pb-4">
          {stateNamesDyn.map((name, stateIdx) => (
            <GroupButton
              key={name}
              state={stateIdx}
              name={name}
              total={groupTotals?.[stateIdx] || 0}
              isDisabled={!canBetting}
              onPress={(event: any) => { onAdd(stateIdx, [], BetType.WinningGroup, event.target) }}
            />
          ))}
        </div>
      </BetSection>

      <BetSection icon={<Top3Icon />} title={t('race.label.top3any')} odd={gameTypeMap[BetType.Top3Any]}>
        <div className="grid grid-cols-6 gap-x-1 gap-y-2 pt-2 pb-4">
          {runnerCountList.map((runnerNo) => (
            <RunnerButton
              key={runnerNo}
              single={single}
              no={runnerNo}
              raceRunners={raceRunners}
              isDisabled={!canBetting}
              onPress={(event: any) => { onAdd(getRunnerState(runnerNo, single), [runnerNo], BetType.Top3Any, event.target) }}
            />
          ))}
        </div>
      </BetSection>

      <BetSection icon={<Top3Icon />} title={t('race.label.top3bet')} odd={gameTypeMap[BetType.Top3Fixed]}>
        <Top3Picker single={single} runnerCountList={runnerCountList} onAdd={onAdd} type={BetType.Top3Fixed} raceRunners={raceRunners} canBetting={canBetting} />
      </BetSection>

      <BetSection icon={<Top3Icon />} title={t('race.label.top3Ran')} odd={gameTypeMap[BetType.Top3Random]}>
        <Top3Picker single={single} runnerCountList={runnerCountList} onAdd={onAdd} type={BetType.Top3Random} raceRunners={raceRunners} canBetting={canBetting} />
      </BetSection>
    </div>
  )
}
