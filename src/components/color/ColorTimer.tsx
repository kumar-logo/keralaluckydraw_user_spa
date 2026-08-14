import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Progress } from '@nextui-org/react'
import { useUIStore } from '../../stores/uiStore'
import { subscribeToClock } from '../../hooks/useClock'
import { TicketCard } from '../shared/TicketCard'
import { CountdownDisplay } from '../shared/CountdownDisplay'
import { GameRulesTrigger } from '../shared/GameRulesTrigger'
import { ColorDrawAnimation, type ColorDrawAnimationRef } from './ColorDrawAnimation'
import { OutlineBall } from '../shared/WingoBall'
import { AnimatedDigitRoller } from '../shared/AnimatedDigitRoller'
import type { ColorGameInfoDto } from '../../services/colorApi'

function generateBalls(size = 32, disabled = false, border = false) {
  return Array(10).fill(0).map((_, i) => (
    <OutlineBall key={i} border={border} size={size} content={i} disabled={disabled} />
  ))
}

interface ColorTimerProps {
  gameInfo?: ColorGameInfoDto
  onNextLottery: () => void
  onBetting: (canBet: boolean) => void
  onRule: () => void
  drawTime?: number
  serverOffset?: number
}

export const ColorTimer = ({ gameInfo, onNextLottery, onBetting, onRule, drawTime, serverOffset }: ColorTimerProps) => {
  const { t } = useTranslation()
  const isDarkMode = useUIStore((s) => s.isDarkMode)
  const balls = useMemo(generateBalls, [])
  const drawRef = useRef<ColorDrawAnimationRef>(null)
  const [version, setVersion] = useState(0)
  const [remainSec, setRemainSec] = useState(0)
  const wasCountingRef = useRef(false)
  const lastShownRoundRef = useRef<string | null>(null)
  const openedRoundRef = useRef<string | null>(null)

  useEffect(() => {
    return subscribeToClock(() => {
      const deadline =
        typeof drawTime === 'number' && drawTime > 0
          ? drawTime
          : gameInfo?.drawTimeSec
            ? Number(gameInfo.drawTimeSec) * 1000
            : 0
      const secs =
        deadline > 0
          ? Math.round((deadline - (Date.now() + (serverOffset || 0))) / 1000)
          : Math.max(0, Math.trunc(gameInfo?.lessSec || 0))
      setRemainSec(Math.max(0, secs))
    })
  }, [drawTime, serverOffset, gameInfo])

  const remainValue = useMemo(() => {
    const s = Math.max(0, remainSec)
    return {
      days: String(Math.floor(s / 86400)).padStart(2, '0'),
      hours: String(Math.floor((s % 86400) / 3600)).padStart(2, '0'),
      minutes: String(Math.floor((s % 3600) / 60)).padStart(2, '0'),
      seconds: String(s % 60).padStart(2, '0'),
    }
  }, [remainSec])

  const progress = useMemo(
    () => (gameInfo?.tabMin ? (Math.max(0, remainSec) * 100 / gameInfo.tabMin / 60) : 0),
    [gameInfo, remainSec]
  )

  useEffect(() => {
    const stopSec = gameInfo?.stopSec || 10
    if (remainSec > 0) {
      wasCountingRef.current = true
      onBetting?.(remainSec > stopSec && (gameInfo?.status ?? 0) === 0)
      if (
        remainSec <= 3 &&
        gameInfo?.roundNo &&
        gameInfo.roundNo !== openedRoundRef.current
      ) {
        openedRoundRef.current = gameInfo.roundNo
        drawRef.current?.open()
      }
    } else if (wasCountingRef.current) {
      wasCountingRef.current = false
      onBetting?.(false)
      setTimeout(() => onNextLottery?.(), 1000)
    }
  }, [remainSec, gameInfo])

  useEffect(() => {
    if (!gameInfo) return
    const lastRoundNo = gameInfo?.lastRoundNo ?? null
    if (lastRoundNo && lastRoundNo !== lastShownRoundRef.current) {
      lastShownRoundRef.current = lastRoundNo
      setVersion((v) => v + 1)
      if (gameInfo.lastResult !== undefined) drawRef.current?.close(gameInfo.lastResult)
    }
  }, [gameInfo])

  return (
    <>
      <Progress
        aria-label="Loading..."
        classNames={{
          base: 'w-full h-1 game-progress-base',
          track: 'rounded-none',
          indicator: 'rounded-none',
        }}
        value={progress}
      />
      <TicketCard
        className="flex flex-col"
        bgColor={isDarkMode ? 'var(--bg-color-gray)' : 'var(--bg-color-lightGray)'}
        cardClassName="bg-linear-to-r from-[#F18F34] to-[#F2346D]"
      >
        <div className="flex flex-col">
          <div className="flex items-center">
            <div className="flex-1 flex flex-col text-white font-bold">
              <div className="flex items-center">
                <Image src="/images/common/clock.webp" alt="click" className="size-5" />
                <div className="text-sm ml-1">
                  {t('wingo.title')}-{gameInfo?.tabMin}{t('common.label.min')}
                </div>
              </div>
              <div className="text-xs mt-0.5">
                <span className="text-white/80 mr-1 font-medium">{t('common.label.games.LastDraw')}</span>
                {gameInfo?.lastRoundNo || '-'}
              </div>
            </div>
            <div className="flex items-center bg-white/10 border border-[#0003] rounded-sm px-3 py-1 gap-3">
              <span className="text-10 text-white w-15 mr-4">{t('common.label.games.LastDrawResult')}</span>
              <div className="size-8">
                <AnimatedDigitRoller
                  data={balls}
                  currentIndex={gameInfo?.lastResult !== undefined && Number.isFinite(+gameInfo.lastResult) ? +gameInfo.lastResult : 0}
                  version={version}
                />
              </div>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <div className="flex-1 p-2 bg-black/30 flex items-center justify-between text-xs">
              <div>
                <div className="text-white/80">{t('common.label.games.nextDraw')}</div>
                <div className="text-white font-bold">{gameInfo?.roundNo}</div>
              </div>
              <CountdownDisplay timeData={remainValue} />
            </div>
            <GameRulesTrigger
              triggleRules={onRule}
              pid="Wingo_Game_Container"
              cid="Wingo_Btn_Tab"
            />
          </div>
        </div>
      </TicketCard>
      <ColorDrawAnimation ref={drawRef} />
    </>
  )
}
