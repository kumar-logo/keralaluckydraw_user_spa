import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Progress } from '@nextui-org/react'
import { resolveAssetUrl } from '../../utils/helpers'
import { useUIStore } from '../../stores/uiStore'
import { subscribeToClock } from '../../hooks/useClock'
import { TicketCard as GameHeaderCard } from '../shared/TicketCard'
import { CountdownDisplay } from '../shared/CountdownDisplay'
import { ScrollToTabButton } from '../shared/ScrollToTabButton'
import { SnackBar, SnackBarRef } from '../shared/SnackBar'
import { ColorResult } from '../four_five_digit/ColorBall'
import { usePositionConfig } from '../../config/positionContext'
import { ThreeDigitCurrentRound, ThreeDigitPickTime } from '../../services/threeDigitApi'

interface ThreeDigitGameTimerProps {
  countDown?: number
  onRule?: () => void
  pickName?: string
  pickNum?: string
  drawResult?: string
  tip?: string
  cycle?: number
  queryList?: ThreeDigitPickTime[]
  onTimeEnd?: () => void
  gameIcon?: string
  pickGameType?: string
  currentGame?: ThreeDigitCurrentRound
  onBetting?: (canBet: boolean) => void
  onDrawStart?: () => void
  drawTime?: number
  serverOffset?: number
  infoDrawTime?: number
}

export const ThreeDigitGameTimer = ({
  countDown = 0,
  onRule,
  pickName = '-',
  pickNum = '-',
  drawResult,
  tip,
  cycle,
  onTimeEnd,
  gameIcon,
  pickGameType = 'normal',
  currentGame,
  onBetting = () => {},
  onDrawStart,
  drawTime,
  serverOffset,
  infoDrawTime,
}: ThreeDigitGameTimerProps) => {
  const { t } = useTranslation()
  const positionConfig = usePositionConfig()
  const [remainSec, setRemainSec] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [resultPulse, setResultPulse] = useState(false)
  const prevDrawResultRef = useRef<string | undefined>(drawResult)
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const wasCountingRef = useRef(false)
  const isDarkMode = useUIStore((s) => s.isDarkMode)
  const snackBarRef = useRef<SnackBarRef>(null)

  const isQuick = useMemo(() => pickGameType === 'quick', [pickGameType])

  useEffect(() => {
    return subscribeToClock(() => {
      const deadline =
        typeof drawTime === 'number' && drawTime > 0
          ? drawTime
          : typeof infoDrawTime === 'number' && infoDrawTime > 0
            ? infoDrawTime
            : 0
      const secs =
        deadline > 0
          ? Math.round((deadline - (Date.now() + (serverOffset || 0))) / 1000)
          : Math.max(0, Math.trunc(countDown))
      setRemainSec(Math.max(0, secs))
    })
  }, [drawTime, serverOffset, countDown, infoDrawTime])

  const remainValue = useMemo(() => {
    const s = Math.max(0, remainSec)
    return {
      days: String(Math.floor(s / 86400)).padStart(2, '0'),
      hours: String(Math.floor((s % 86400) / 3600)).padStart(2, '0'),
      minutes: String(Math.floor((s % 3600) / 60)).padStart(2, '0'),
      seconds: String(s % 60).padStart(2, '0'),
    }
  }, [remainSec])

  useEffect(() => {
    const stopSec = currentGame?.stopBetSec || 30
    if (remainSec > 0) {
      wasCountingRef.current = true
      if (isDrawing) setIsDrawing(false)
      onBetting(remainSec > stopSec && (currentGame?.status ?? 0) === 0)
      if (isQuick && remainSec === 3) {
        snackBarRef.current?.show?.()
        onDrawStart?.()
      }
    } else if (wasCountingRef.current && !isDrawing) {
      setIsDrawing(true)
      onBetting(false)
      if (isQuick) snackBarRef.current?.hide?.()
      onTimeEnd?.()
    }
  }, [remainSec, isDrawing, currentGame?.status])

  useEffect(() => {
    const incoming = drawResult
    if (
      incoming &&
      incoming !== '***' &&
      incoming !== '???' &&
      incoming !== prevDrawResultRef.current
    ) {
      prevDrawResultRef.current = incoming
      setResultPulse(true)
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
      pulseTimerRef.current = setTimeout(() => setResultPulse(false), 1400)
    }
  }, [drawResult])

  useEffect(() => () => {
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
  }, [])

  const progressValue = useMemo(
    () =>
      pickGameType === 'quick'
        ? cycle
          ? (remainSec / cycle / 60) * 100
          : 0
        : countDown
          ? (remainSec / countDown) * 100
          : 0,
    [countDown, remainSec, cycle]
  )

  return (
    <div className="flex flex-col">

      {isQuick && (
        <Progress
          aria-label="Loading..."
          classNames={{
            base: 'w-full h-1 game-progress-base',
            track: 'rounded-none',
            indicator: 'rounded-none',
          }}
          value={progressValue}
        />
      )}

      <GameHeaderCard
        className="flex flex-col p-2"
        bgColor={isDarkMode ? 'var(--bg-color-gray)' : 'white'}
        cardClassName="bg-[#65B2FB]"
      >

        <div className="flex justify-between items-center">
          <div className="flex items-center flex-1">
            <img
              className="h-8 w-11.5 rounded-none object-contain"
              src={resolveAssetUrl(gameIcon)}
              alt=""
            />
            <div className="ml-2">
              <p className="text-sm text-white font-bold">{pickName}</p>
              <p className="text-xs text-white/80">
                {t('common.label.games.LastDraw')}{' '}
                <span className="font-bold text-white">{pickNum}</span>
              </p>
            </div>
          </div>
          <div className="rounded-lg flex px-2 py-1 flex-col items-center gap-5 justify-center bg-white/10 border border-[#0003] gap-y-1">
            <p className="text-9 text-white/80">
              {t('common.label.games.LastDrawResult')}
            </p>
            <div
              className="flex items-center gap-x-1"
              style={{
                transform: resultPulse ? 'scale(1.25)' : 'scale(1)',
                transition: 'transform 300ms ease-out',
              }}
            >
              <ColorResult
                result={
                  drawResult || '*'.repeat(positionConfig.labels.length || 3)
                }
              />
            </div>
          </div>
        </div>

        <div className="flex mt-3 gap-x-2">
          <div className="flex flex-1 flex-row bg-black/10 p-2 items-center justify-between">
            <div className="text-xs text-white/80">
              <p>{t('common.label.games.nextDraw')}</p>
              <p className="text-white">{tip}</p>
            </div>
            {isDrawing ? (
              <div className="flex items-center gap-1 px-3 py-1.5">
                <span className="size-1.5 rounded-full bg-white animate-pulse" />
                <span className="size-1.5 rounded-full bg-white animate-pulse [animation-delay:200ms]" />
                <span className="size-1.5 rounded-full bg-white animate-pulse [animation-delay:400ms]" />
              </div>
            ) : (
              <CountdownDisplay
                timeData={
                  remainValue as {
                    days: string
                    hours: string
                    minutes: string
                    seconds: string
                  }
                }
              />
            )}
          </div>
          <ScrollToTabButton
            triggleRules={onRule}
            pid="Digit_Game_Container"
            cid="Digit_Btn_Tab"
          />
        </div>
      </GameHeaderCard>

      <SnackBar ref={snackBarRef} />
    </div>
  )
}
