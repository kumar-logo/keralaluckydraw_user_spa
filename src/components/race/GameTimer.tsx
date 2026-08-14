import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { subscribeToClock } from '../../hooks/useClock'
import { stateNames, stateColors, RaceRunner } from '../../config/raceConstants'
import type { RaceGameInfoDto } from '../../services/raceApi'
import { PlayerBadge, GroupBadge } from './Badges'

const GROUP_BG_OPACITY: Record<number, number> = { 0: 0.24, 1: 0.24, 2: 0.24, 3: 0.5, 4: 0.2, 5: 0.14 }

const RunnerPreview = ({ state, total, no, raceRunners }: { state: number; total: number; no: number; raceRunners?: RaceRunner[] | null }) => (
  <div className="relative">
    <div
      className="w-6 h-3.5 text-white leading-3.5 text-10 font-bold text-center rounded-sm absolute left-1/2 -ml-3 -top-1.5"
      style={{ backgroundColor: raceRunners?.[state]?.colorHex ?? stateColors[state % stateColors.length] }}
    >
      {no}
    </div>
    <PlayerBadge state={state} size={40} raceRunners={raceRunners} />
    <div className="w-full h-4 absolute left-0 -bottom-1 bg-white rounded-sm flex items-center justify-center">
      <span className="text-8 text-acc mr-1">Win</span>
      <span className="text-10 font-bold text-primary">{total}</span>
    </div>
  </div>
)

const RunnerPanel = ({ state, gameInfo, single, raceRunners }: { state: number; gameInfo?: RaceGameInfoDto; single: boolean; raceRunners?: RaceRunner[] | null }) => {
  if (single) {
    return (
      <div className="h-13.5">
        <RunnerPreview state={state} no={state + 1} total={gameInfo?.last100Top1?.[state + 1] || 0} raceRunners={raceRunners} />
      </div>
    )
  }
  return (
    <div className="h-20 py-1 rounded-lg border border-dashed border-gray dark:border-acc relative">
      <div
        className="grayscale absolute left-0 -top-0.5 flex justify-center size-full"
        style={{ opacity: GROUP_BG_OPACITY[state] }}
      >
        <GroupBadge state={state} size={64} />
      </div>
      <div className="size-full flex flex-col items-center relative z-10">
        <div className="flex-1 flex items-center">
          <RunnerPreview state={state} no={state * 2 + 1} total={gameInfo?.last100Top1?.[state * 2 + 1] || 0} raceRunners={raceRunners} />
          <div className="w-1" />
          <RunnerPreview state={state} no={state * 2 + 2} total={gameInfo?.last100Top1?.[state * 2 + 2] || 0} raceRunners={raceRunners} />
        </div>
        <div className="text-10 font-bold mt-0.5">{raceRunners?.[state]?.name ?? stateNames[state % stateNames.length]}</div>
      </div>
    </div>
  )
}

export const RaceGameTimer = ({ gameInfo, updateInfo, canBetting, setCanBetting, single, updateFrame, raceRunners, drawTime, serverOffset }: {
  gameInfo?: RaceGameInfoDto
  updateInfo: () => void
  canBetting: boolean
  setCanBetting: (v: boolean) => void
  single: boolean
  updateFrame: () => void
  raceRunners?: RaceRunner[] | null
  drawTime?: number
  serverOffset?: number
}) => {
  const { t } = useTranslation()
  const [remainSec, setRemainSec] = useState(0)
  const lastRoundRef = useRef('')
  const wasCountingRef = useRef(false)

  useEffect(() => {
    return subscribeToClock(() => {
      const hasDraw = typeof drawTime === 'number' && drawTime > 0
      const secs = hasDraw
        ? Math.round((drawTime - (Date.now() + (serverOffset || 0))) / 1000)
        : gameInfo
          ? Math.floor(gameInfo.drawTimeSec - Date.now() / 1e3)
          : 0
      setRemainSec(secs)
    })
  }, [drawTime, serverOffset, gameInfo])

  const displayValues = useMemo(() => {
    const s = Math.max(0, remainSec)
    return {
      days: String(Math.floor(s / 86400)).padStart(2, '0'),
      hours: String(Math.floor((s % 86400) / 3600)).padStart(2, '0'),
      minutes: String(Math.floor((s % 3600) / 60)).padStart(2, '0'),
      seconds: String(s % 60).padStart(2, '0'),
    }
  }, [remainSec])

  useEffect(() => {
    if (remainSec > 0) {
      wasCountingRef.current = true
      if (gameInfo) {
        const stopBettingSec = gameInfo.stopBettingSec ?? 20
        const frameSec = gameInfo.frameSec ?? 18
        const open = remainSec > stopBettingSec && (gameInfo.status ?? 0) === 0
        if (open !== canBetting) setCanBetting(open)
        if (remainSec <= frameSec && lastRoundRef.current !== gameInfo.roundNo) {
          updateFrame()
          lastRoundRef.current = gameInfo.roundNo
        }
      }
    } else if (wasCountingRef.current) {
      wasCountingRef.current = false
      updateInfo()
    }
  }, [remainSec, gameInfo])

  return (
    <div className="p-2 bg-white/90 dark:bg-gray rounded-lg">
      <div className="text-10 leading-3 mb-1">{t('race.label.champDec')}</div>
      <div className={single ? 'flex items-center justify-between pt-3' : 'grid grid-cols-3 gap-1'}>
        <RunnerPanel single={single} state={0} gameInfo={gameInfo} raceRunners={raceRunners} />
        <RunnerPanel single={single} state={1} gameInfo={gameInfo} raceRunners={raceRunners} />
        <RunnerPanel single={single} state={2} gameInfo={gameInfo} raceRunners={raceRunners} />
        <RunnerPanel single={single} state={3} gameInfo={gameInfo} raceRunners={raceRunners} />
        <RunnerPanel single={single} state={4} gameInfo={gameInfo} raceRunners={raceRunners} />
        <RunnerPanel single={single} state={5} gameInfo={gameInfo} raceRunners={raceRunners} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <div>
          <div className="capitalize text-acc text-10">{t('common.label.table.issue')}</div>
          <div className="font-sm text-main font-bold leading-4">{gameInfo?.roundNo}</div>
        </div>
        <div className="flex items-center text-xl font-bold text-white">
          <div className="size-8 bg-black rounded-xs flex items-center justify-center din">
            {displayValues.minutes}
          </div>
          <span className="mx-0.5 text-black">:</span>
          <div className="size-8 bg-black rounded-xs flex items-center justify-center din">
            {displayValues.seconds}
          </div>
        </div>
      </div>
    </div>
  )
}
