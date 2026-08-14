import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, ModalContent, useDisclosure } from '@nextui-org/react'
import { subscribeToClock } from '../../hooks/useClock'
import { useAudio } from '../../hooks/useAudio'
import { DubaiGameInfo } from '../../services/dubaiApi'
import { DubaiNumberIcon } from './DubaiIcons'

interface ResultIconProps {
  result: number
}

const ResultIcon = ({ result }: ResultIconProps) => {
  if (result) {
    return <DubaiNumberIcon number={result} className="size-16 text-(--dubai-theme-color)" />
  }
  return <></>
}

interface TimerDigitProps {
  value: string | number
  label: string
}

const TimerDigit = ({ value, label }: TimerDigitProps) => (
  <div className="flex rounded-lg overflow-hidden bg-white p-px size-12">
    <div className="flex-1 rounded-lg flex flex-col bg-(--dubai-theme-color)">
      <div className="py-1 font-black bg-white rounded-b-lg w-full text-center text-(--dubai-theme-color)">
        {value}
      </div>
      <div className="din text-8 font-normal py-0.5 px-1.5">
        {label}
      </div>
    </div>
  </div>
)

interface DrawAnimationProps {
  remainTime: number
  themeColor: string
  numbers: number[]
}

const DrawAnimation = ({ remainTime, themeColor, numbers }: DrawAnimationProps) => {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure()
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [resultNumber, setResultNumber] = useState(0)
  const animationAudio = useAudio('/audio/dubai-ani.mp3')
  const resultAudio = useAudio('/audio/dubai-res.mp3')

  useEffect(() => {
    if (remainTime > 2 && remainTime <= 4 && !isOpen) {
      animationAudio.play()
      onOpen()

      const span = numbers.length || 36
      intervalRef.current = setInterval(() => {
        setHighlightIndex(() => Math.floor(Math.random() * span))
      }, 200)

      const closeAndReset = (revealed?: number) => {
        onClose()
        setResultNumber(0)
        window.dispatchEvent(
          new CustomEvent('dubai-reveal-done', { detail: revealed ?? 0 })
        )
      }

      const fallbackTimeout = setTimeout(() => {
        window.removeEventListener('dubai-draw-result', handleResult as EventListener)
        closeAndReset()
      }, 8000)

      const handleResult = (event: CustomEvent) => {
        const result = parseInt(event.detail || '0')
        if (result) {
          resultAudio.play()
          setResultNumber(result)
          setTimeout(() => {
            closeAndReset(result)
          }, 2000)
        } else {
          closeAndReset()
        }
        setHighlightIndex(-1)
        clearInterval(intervalRef.current)
        clearTimeout(fallbackTimeout)
      }

      window.addEventListener('dubai-draw-result', handleResult as EventListener, {
        once: true,
      })

      const handleVisibility = () => {
        if (document.visibilityState !== 'visible') {
          onClose()
          clearInterval(intervalRef.current)
          try {
            animationAudio.stop()
            resultAudio.stop()
          } catch (err) {
            console.warn(err)
          }
        }
      }

      document.addEventListener('visibilitychange', handleVisibility)

      return () => {
        document.removeEventListener('visibilitychange', handleVisibility)
      }
    }
  }, [remainTime])

  return (
    <>

      <Modal
        isOpen={isOpen}
        onOpenChange={() => {
          onOpenChange()
          setResultNumber(0)
        }}
        hideCloseButton
        isDismissable={false}
        classNames={{
          base: 'm-0 bg-transparent shadow-none rounded-none',
          wrapper: 'z-60',
          backdrop: 'z-60',
        }}
        radius="none"
        placement="center"
      >
        <ModalContent
          className="flex justify-end p-4 items-center bg-no-repeat bg-cover w-80 h-135 relative"
          style={{
            backgroundImage: 'url(/images/dubai/prize-draw-bg.webp)',
            '--dubai-theme-color': themeColor,
          } as React.CSSProperties}
        >
          <div className="p-5 grid grid-cols-6 gap-x-4 gap-y-5 bg-white dark:bg-gray rounded-xl">
            {numbers.map((num, index) => (
              <div
                key={num}
                className={
                  'duration-200 rounded-full ' +
                  (highlightIndex === index
                    ? 'text-white bg-(--dubai-theme-color)'
                    : 'text-(--dubai-theme-color) bg-white dark:bg-gray')
                }
              >
                <DubaiNumberIcon number={num} className="size-7" />
              </div>
            ))}
          </div>
        </ModalContent>
      </Modal>

      <div
        className={
          'fixed top-0 left-0 w-screen h-screen z-65 flex justify-center items-center ' +
          (resultNumber
            ? 'bg-black/30 duration-500'
            : 'bg-black/0 pointer-events-none')
        }
      >
        <div
          className={
            'size-80 bg-no-repeat bg-cover flex justify-center items-center ' +
            (resultNumber ? 'duration-500 scale-100' : 'scale-0')
          }
          style={{
            backgroundImage: 'url(/images/dubai/prize-result-bg.webp)',
          }}
        >
          <div className="size-32 flex flex-col items-center justify-center rounded-3xl outline-solid outline-[0.75rem] bg-white outline-white/60 dark:bg-gray dark:outline-gray/60">
            {resultNumber ? <ResultIcon result={resultNumber} /> : <></>}
            <p className="mt-2 text-(--dubai-theme-color) text-2xl font-black">
              {resultNumber}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

interface DubaiTimerProps {
  gameInfo?: DubaiGameInfo
  updateInfo: (reset: boolean) => Promise<DubaiGameInfo | null>
  setCanBetting: (canBet: boolean) => void
  themeColor: string
  drawTime?: number
  serverOffset?: number
  phaseLabel?: string
}

export const DubaiTimer = ({
  gameInfo,
  updateInfo,
  setCanBetting,
  themeColor,
  drawTime,
  serverOffset,
  phaseLabel,
}: DubaiTimerProps) => {
  const { t } = useTranslation()
  const [remainSec, setRemainSec] = useState(0)
  const wasCountingRef = useRef(false)

  const numbers = useMemo(() => {
    const min = Number(gameInfo?.numberMin)
    const max = Number(gameInfo?.numberMax)
    const lo = Number.isInteger(min) && min >= 1 ? min : 1
    const hi = Number.isInteger(max) && max >= lo ? max : 36
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
  }, [gameInfo?.numberMin, gameInfo?.numberMax])

  useEffect(() => {
    return subscribeToClock(() => {
      const nowMs = Date.now() + (serverOffset || 0)
      const hasDraw = typeof drawTime === 'number' && drawTime > 0
      const drawTimeSec = gameInfo?.drawTimeSec
      let secs: number
      if (hasDraw) {
        secs = Math.round((drawTime - nowMs) / 1000)
      } else if (typeof drawTimeSec === 'number' && drawTimeSec > 0) {
        secs = Math.round((drawTimeSec * 1000 - nowMs) / 1000)
      } else {
        secs = Math.max(0, Math.trunc(gameInfo?.lessSec || 0))
      }
      setRemainSec(phaseLabel ? 0 : secs)
    })
  }, [drawTime, serverOffset, gameInfo, phaseLabel])

  const remainValue = useMemo(() => {
    const s = Math.max(0, remainSec)
    return {
      days: String(Math.floor(s / 86400)).padStart(2, '0'),
      hours: String(Math.floor((s % 86400) / 3600)).padStart(2, '0'),
      minutes: String(Math.floor((s % 3600) / 60)).padStart(2, '0'),
      seconds: String(s % 60).padStart(2, '0'),
    }
  }, [remainSec])

  const lastResult = gameInfo?.lastResult
  const lastResultText = useMemo(
    () => (lastResult?.number != null ? String(lastResult.number) : lastResult?.drawResult || ''),
    [lastResult]
  )
  const lastResultNumber = useMemo(() => {
    const parsed = parseInt(lastResultText, 10)
    return isNaN(parsed) ? -1 : parsed
  }, [lastResultText])

  useEffect(() => {
    if (phaseLabel) {
      setCanBetting(false)
      return
    }
    if (remainSec > 0) {
      wasCountingRef.current = true
      setCanBetting(remainSec > (gameInfo?.stopBettingSec || 5) && (gameInfo?.status ?? 0) === 0)
    } else if (wasCountingRef.current) {
      wasCountingRef.current = false
      setCanBetting(false)
      updateInfo(false)
    }
  }, [remainSec, gameInfo, phaseLabel])

  return (
    <div
      className="bg-cover bg-no-repeat h-44 p-3 text-white flex flex-col justify-end bg-light-gray shrink-0"
      style={{
        backgroundImage: `url(${gameInfo?.assetBackground || gameInfo?.cover})`,
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex flex-col text-xs font-bold">
          <div className="flex items-center">
            <span className="text-white/80 mr-1 font-medium">{t('common.label.games.LastDraw')}</span>
            {lastResult?.roundNo || '-'}
          </div>
          <div className="flex items-center mt-0.5">
            <span className="text-white/80 mr-1 font-medium">{t('common.label.games.LastDrawResult')}</span>
            {lastResultNumber > 0 ? (
              <DubaiNumberIcon number={lastResultNumber} className="size-6 text-white" />
            ) : (
              <span>{lastResultText || '-'}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <p className="text-sm font-bold uppercase">
            {t('common.label.games.nextDraw')}
          </p>
          <span className="text-xs font-bold">{gameInfo?.roundNo || '-'}</span>
        </div>
        {phaseLabel ? (
          <span className="text-sm font-bold uppercase">{phaseLabel}</span>
        ) : (
          <div className="flex items-center">
            <TimerDigit value={remainValue.minutes} label="MINUTES" />
            <span className="mx-0.5">:</span>
            <TimerDigit value={remainValue.seconds} label="SECONDS" />
          </div>
        )}
      </div>

      <DrawAnimation remainTime={remainSec} themeColor={themeColor} numbers={numbers} />
    </div>
  )
}
