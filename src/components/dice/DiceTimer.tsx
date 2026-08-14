import { useState, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Progress, Modal, ModalContent, useDisclosure } from '@nextui-org/react'
import clsx from 'clsx'
import { subscribeToClock } from '../../hooks/useClock'
import { useAudio } from '../../hooks/useAudio'
import { fetchJsonCached } from '../../utils/jsonCache'
import { useUIStore } from '../../stores/uiStore'
import { TicketCard } from '../shared/TicketCard'
import { CountdownDisplay } from '../shared/CountdownDisplay'
import { GameRulesTrigger } from '../shared/GameRulesTrigger'
import { DiceSingle, DiceNum, DiceSumBadge } from './DiceVisuals'
import { AnimatedDigitRoller } from '../shared/AnimatedDigitRoller'
import { type DiceGameInfoDto } from '../../services/diceApi'

const DiceDrawSprite = ({ backgroundPosition, className }: { backgroundPosition: string; className?: string }) => (
  <div
    className={clsx('bg-no-repeat', className)}
    style={{
      backgroundImage: 'url(/images/games/dice/draw-lottie/sprite.webp)',
      backgroundSize: '36.75rem 23.625rem',
      backgroundPosition,
    }}
  />
)

const OverlayFrame = ({ className }: { className?: string }) => (
  <DiceDrawSprite className={clsx('size-52', className)} backgroundPosition="right top" />
)

const DrawDice = ({ value, className }: { value: number; className?: string }) => {
  const pos = useMemo(
    () => `bottom -${value < 4 ? 7 : 3.375}rem right -${2.25 + [0, 2, 1][value % 3] * 3.625}rem`,
    [value]
  )
  return <DiceDrawSprite className={clsx('size-14', className)} backgroundPosition={pos} />
}

const LargeBackground = ({ className }: { className?: string }) => (
  <DiceDrawSprite className={clsx('size-94.5', className)} backgroundPosition="left top" />
)

export interface DiceDrawRef {
  start: () => void
  stop: (result: number[]) => void
}

const DICE_SPIN_MS = 3500
const DICE_REVEAL_HOLD_MS = 3000

export const DiceDrawAnimation = forwardRef<DiceDrawRef>((_, ref) => {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure()
  const [result, setResult] = useState<number[]>([])
  const startTime = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audio = useAudio('/audio/roll-dice.aac')
  const [lottieSrc, setLottieSrc] = useState<string | null>(null)

  useEffect(() => {
    fetchJsonCached('/json/k3-dice-draw.json')
      .then(d => setLottieSrc(JSON.stringify(d)))
      .catch(() => {})
  }, [])

  const start = () => {
    setResult([])
    startTime.current = performance.now()
    onOpen()
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(onClose, DICE_SPIN_MS)
    setTimeout(() => audio.play(), 50)
  }

  const stop = (vals: number[]) => {
    if (!startTime.current) return
    const elapsed = performance.now() - startTime.current
    if (elapsed > DICE_SPIN_MS) return
    if (timer.current) clearTimeout(timer.current)
    const reveal = () => {
      setResult(vals)
      timer.current = setTimeout(onClose, DICE_REVEAL_HOLD_MS)
    }
    if (elapsed < DICE_SPIN_MS) timer.current = setTimeout(reveal, DICE_SPIN_MS - elapsed)
    else reveal()
  }

  useImperativeHandle(ref, () => ({ start, stop }))

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return (
    <Modal isOpen={isOpen} isDismissable={false} onOpenChange={onOpenChange} hideCloseButton placement="center">
      <ModalContent className="bg-transparent shadow-none w-full m-0! h-150 rounded-none">
        <div className="absolute bottom-18 left-20.5">
          {result.length > 0 && (
            <>
              <div className="size-94.5 absolute -bottom-12 -left-19.5 z-0 animate-scale">
                <LargeBackground />
              </div>
              <OverlayFrame className="relative z-10" />
              <DrawDice className="absolute shrink-0 z-20 bottom-19 left-10" value={result[0]} />
              <DrawDice className="absolute shrink-0 z-20 bottom-19 left-29" value={result[1]} />
              <DrawDice className="absolute shrink-0 z-10 bottom-24 left-20" value={result[2]} />
            </>
          )}
        </div>
        {lottieSrc && (
          <lottie-player className="relative z-30" src={lottieSrc} autoplay />
        )}
      </ModalContent>
    </Modal>
  )
})

export const DiceTimer = ({ onNextLottery, onBetting, gameInfo, onRule, drawTime, serverOffset = 0 }: {
  onNextLottery: () => void
  onBetting: (v: boolean) => void
  gameInfo?: DiceGameInfoDto
  onRule: () => void
  drawTime?: number
  serverOffset?: number
}) => {
  const isDarkMode = useUIStore(s => s.isDarkMode)
  const [remainSec, setRemainSec] = useState(0)
  const wasCountingRef = useRef(false)
  const { t } = useTranslation()

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
          ? Math.round((deadline - (Date.now() + serverOffset)) / 1000)
          : Math.max(0, Math.trunc(gameInfo?.lessSec ?? 0))
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

  const diceData = useMemo(() => Array(6).fill(0).map((_, i) => <DiceSingle key={i} num={i + 1} size={20} />), [])
  const sumData = useMemo(() => Array(16).fill(0).map((_, i) => <DiceNum key={i} size={20} num={i + 3} />), [])
  const bsData = useMemo(() => [
    <DiceSumBadge key={1} size={20} type="big" />,
    <DiceSumBadge key={2} size={20} type="small" />,
    <div key={3} style={{ width: '1.25rem', height: '1.25rem' }} />,
  ], [])
  const oeData = useMemo(() => [
    <DiceSumBadge key={1} size={20} type="odd" />,
    <DiceSumBadge key={2} size={20} type="even" />,
    <div key={3} style={{ width: '1.25rem', height: '1.25rem' }} />,
  ], [])

  const animRef = useRef<DiceDrawRef>(null)
  const [version, setVersion] = useState(0)
  const lastShownRoundRef = useRef<string | null>(null)
  const openedRoundRef = useRef<string | null>(null)

  const progress = useMemo(
    () => gameInfo?.tabMin ? remainSec * 100 / gameInfo.tabMin / 60 : 0,
    [gameInfo, remainSec]
  )

  useEffect(() => {
    const stopSec = gameInfo?.stopSec ?? 10
    if (remainSec > 0) {
      wasCountingRef.current = true
      onBetting?.(remainSec > stopSec && (gameInfo?.status ?? 0) === 0)
      if (
        remainSec <= 1 &&
        gameInfo?.roundNo &&
        gameInfo.roundNo !== openedRoundRef.current
      ) {
        openedRoundRef.current = gameInfo.roundNo
        animRef.current?.start()
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
      setVersion(v => v + 1)
      if (gameInfo.lastResult) {
        animRef.current?.stop(gameInfo.lastResult.split(',').map(Number))
      }
    }
  }, [gameInfo])

  return (
    <div className="flex flex-col">
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
        className="flex flex-col p-2"
        bgColor={isDarkMode ? 'var(--bg-color-gray)' : 'var(--bg-color-lightGray)'}
        cardClassName="bg-[#65B2FB] dark:bg-[#075BA9]"
      >
        <div className="flex items-center">
          <div className="flex-1 flex flex-col text-white font-bold">
            <div className="flex items-center">
              <Image src="/images/common/clock.webp" alt="click" className="size-5" />
              <div className="text-sm ml-1">{t('k3.title.default')}-{gameInfo?.tabMin}{t('common.label.min')}</div>
            </div>
            <div className="text-xs mt-0.5">
              <span className="text-white/80 mr-1 font-medium">{t('common.label.games.LastDraw')}</span>
              {gameInfo?.lastRoundNo ?? '-'}
            </div>
          </div>
          <div className="flex flex-col items-center bg-white/10 border border-[#0003] px-2 py-1 rounded-sm">
            <span className="text-10 text-white/80 mb-2">{t('common.label.games.LastDrawResult')}</span>
            <div className="flex items-center">
              <div className="flex items-center">
                {gameInfo?.lastResult ? gameInfo.lastResult.split(',').map((g: string, j: number) => (
                  <AnimatedDigitRoller key={j} currentIndex={+g - 1} data={diceData} version={version} />
                )) : (
                  <><div className="w-5 h-5" /><div className="w-5 h-5 mx-0.5" /><div className="w-5 h-5" /></>
                )}
              </div>
              <div className="mx-1">
                {gameInfo?.lastTotalCount ? (
                  <AnimatedDigitRoller currentIndex={gameInfo.lastTotalCount - 3} data={sumData} version={version} />
                ) : <div className="w-5 h-5" />}
              </div>
              <div className="flex items-center gap-0.5">
                {gameInfo?.lastTotalCount ? (
                  <AnimatedDigitRoller currentIndex={gameInfo.lastIsLeopard ? 2 : gameInfo.lastTotalCount ? gameInfo.lastTotalCount > 10 ? 0 : 1 : 0} data={bsData} version={version} />
                ) : <div className="w-5 h-5" />}
                {gameInfo?.lastTotalCount ? (
                  <AnimatedDigitRoller currentIndex={gameInfo.lastIsLeopard ? 2 : (gameInfo.lastTotalCount + 1) % 2} data={oeData} version={version} />
                ) : <div className="w-5 h-5" />}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 flex gap-2">
          <div className="flex-1 p-2 bg-black/10 flex items-center justify-between text-xs">
            <div>
              <div className="text-white/80">{t('common.label.games.nextDraw')}</div>
              <div className="text-white font-bold">{gameInfo?.roundNo}</div>
            </div>
            <CountdownDisplay timeData={remainValue as { days: string; hours: string; minutes: string; seconds: string }} />
          </div>
          <GameRulesTrigger
            triggleRules={onRule}
            pid="Dice_Game_Container"
            cid="Dice_Btn_Tab"
          />
        </div>
      </TicketCard>
      <DiceDrawAnimation ref={animRef} />
    </div>
  )
}
