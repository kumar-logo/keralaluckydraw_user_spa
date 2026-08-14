import { useState, useEffect, useCallback } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import clsx from 'clsx'
import { useFrameTimer } from '../../hooks/useFrameTimer'
import { useAudio } from '../../hooks/useAudio'
import { useUIStore } from '../../stores/uiStore'
import { useAppConfigStore } from '../../stores/configStore'
import { BetTagIcon } from './Badges'
import type { RaceBetInfo } from '../../config/raceConstants'
import type { RaceRunnerFrameDto } from '../../services/raceApi'
import { TrackObstacle, AnimatedRunner, WinnerOverlay } from './TrackItems'
import { leftPosition, LINEAR_EASE } from './trackHelpers'

const BRAND_NAME = 'KeralaLuckyDraw'

interface TrackWinner {
  number: number
  no: number
  top: string
}

export const RaceTrack = ({ frameList, onFinish, runnerCountList, single }: {
  frameList: RaceRunnerFrameDto[] | null
  onFinish: (winners: number[]) => void
  runnerCountList: number[]
  single: boolean
}) => {
  const [isActive, setIsActive] = useState(false)
  const trackControls = useAnimationControls()
  const bgControls = useAnimationControls()
  const [currentFrame, setCurrentFrame] = useState(0)
  const [winners, setWinners] = useState<TrackWinner[]>([])
  const rem = useUIStore((s) => s.rem)
  const screenHeight = useUIStore((s) => s.screenHeight)
  const brandName = useAppConfigStore((s) => s.appName) || BRAND_NAME
  const bgmAudio = useAudio('/audio/run-bgm.mp3')
  const [betRunners, setBetRunners] = useState<number[]>([])

  const onFrameTick = useCallback((elapsedMs: number) => {
    const frameNumber = Math.floor(elapsedMs / 1e3 * 30)
    if (frameNumber > 600) frameTimer.pause(); else setCurrentFrame(frameNumber)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const frameTimer = useFrameTimer(onFrameTick)
  const [leadRunner, setLeadRunner] = useState(0)

  useEffect(() => {
    if (!frameList || frameList.length === 0 || currentFrame > 480) return
    const maxPoint = Math.max(...frameList.map((runner) => runner.frameData?.[currentFrame]?.point ?? 0))
    if (maxPoint > 100 && maxPoint <= 1e3) {
      trackControls.start(leftPosition((100 - maxPoint) * 0.15 * rem), LINEAR_EASE)
      bgControls.start(leftPosition((100 - maxPoint) * 0.01 * rem), LINEAR_EASE)
      if (maxPoint <= 900) {
        const leaderNumber = frameList.find((runner) => runner.frameData?.[currentFrame]?.point === maxPoint)?.number
        if (leaderNumber && leaderNumber !== leadRunner) setLeadRunner(leaderNumber)
      } else {
        if (leadRunner) setLeadRunner(0)
      }
    }
    if (maxPoint > 1e3 && winners.length < 3) {
      const finisher = frameList.find((runner) => (runner.frameData?.[currentFrame]?.point ?? 0) >= 1e3 && !winners.some((existing) => existing.number === runner.number))
      if (finisher) {
        setWinners((prev) => {
          const updated = [...prev]
          updated.push({
            number: finisher.number,
            no: prev.length === 0 ? 2 : prev.length === 1 ? 1 : 0,
            top: (finisher.number - 1) * (single ? 3.75 : 2.5) + 1.625 + 'rem',
          })
          return updated
        })
      }
    }
  }, [currentFrame])

  useEffect(() => {
    if (winners.length > 2) onFinish(winners.map((w) => w.number))
  }, [winners])

  const playBgm = () => { bgmAudio.play() }

  useEffect(() => {
    if (frameList?.length) {
      const betInfoStr = sessionStorage.getItem('race12-bet-info')
      if (betInfoStr) {
        try {
          const betInfo = JSON.parse(betInfoStr) as RaceBetInfo
          if (betInfo) {
            setBetRunners(betInfo.list.reduce<number[]>((acc, betItem) => {
              if (betItem.type === 2) {
                const numbers = betItem.num.split(',').map((num) => parseInt(num, 10))
                acc.push(...numbers)
              } else {
                const parsedNum = parseInt(betItem.num, 10)
                if (betItem.type === 1) acc.push(parsedNum)
                else if (betItem.type === 3) {
                  const pairNum = parsedNum * 2
                  acc.push(pairNum, pairNum - 1)
                }
              }
              return acc
            }, []))
          }
        } catch (err) {
          console.warn(err)
          setBetRunners([])
        } finally {
          sessionStorage.removeItem('race12-bet-info')
        }
      } else {
        setBetRunners([])
      }
      setWinners([])
      const startTimeout = setTimeout(() => {
        setIsActive(() => true)
        frameTimer.play()
        playBgm()
      }, 4e3)
      return () => { clearTimeout(startTimeout) }
    } else {
      requestAnimationFrame(() => {
        setIsActive(false)
        trackControls.start(leftPosition(0), LINEAR_EASE)
        bgControls.start(leftPosition(0), LINEAR_EASE)
        frameTimer.pause()
        frameTimer.reset()
        setCurrentFrame(0)
      })
    }
  }, [frameList])

  return (
    <div className="size-full bg-green-200 overflow-hidden relative">
      <motion.div
        animate={bgControls}
        className={(screenHeight < 700 ? 'h-[3.75rem]' : 'h-25') + ' bg-cover relative bg-repeat-x w-140'}
        style={{ backgroundImage: 'url(/images/race/track-vision.webp)' }}
      />
      <motion.div
        animate={trackControls}
        className="bg-linear-to-b from-[#eccb9f] to-[#f19276] w-636 pb-24 relative overflow-hidden will-change-transform"
      >
        <div className="flex w-full">
          {[...Array(20).keys()].map((i) => (
            <p
              key={i}
              className="bg-linear-to-b flex-1 text-center shrink-0 odd:from-[#BBC756] odd:to-[#9CBA52] even:from-[#FEB962] even:to-[#EEA64A] text-xs font-bold py-0.5 px-3 text-nowrap text-black"
              style={{ boxShadow: '0px -1px 2px 0px rgba(0, 0, 0, 0.25) inset' }}
            >
              {brandName}
            </p>
          ))}
        </div>

        {winners.map((w) => (
          <WinnerOverlay key={w.number} single={single} top={w.top} number={w.number} no={w.no} />
        ))}

        {runnerCountList.map((runnerNum, i) => (
          <div
            key={i}
            className={clsx('border-white flex items-center relative', single ? 'h-15 border-b-4 pl-4.5' : 'h-10 border-b-2 pl-3')}
          >
            <div className={clsx('absolute flex items-center', single ? 'pl-10.5' : 'pl-7')}>
              <div className={clsx('rounded-sm bg-white mr-3', single ? 'h-9 w-0.75' : 'h-6 w-0.5')} />
              <p className={clsx('font-black text-white italic opacity-60', single ? 'text-2xl' : 'text-base')}>
                {runnerNum}
              </p>
            </div>
            <div className={clsx('absolute flex items-center justify-end left-590', single ? 'w-30' : 'w-20')}>
              <p className={clsx('font-black text-white italic', single ? 'text-2xl' : 'text-base')}>
                {runnerNum}
              </p>
              <div className={clsx('rounded-sm bg-white ml-3 mr-6', single ? 'h-9 w-0.75' : 'h-6 w-0.5')} />
              <div className={clsx('bg-white', single ? 'h-15 w-1.5' : 'h-10 w-1')} />
            </div>

            {frameList?.[i]?.items?.map((obstacle) => {
              const frameData = frameList[i].frameData[currentFrame]
              const isPassed = !!obstacle && !!frameData && obstacle.point < frameData.point
              return <TrackObstacle key={obstacle.point} single={single} item={obstacle} hide={isPassed} />
            })}

            {frameList?.[i] && (
              <AnimatedRunner
                single={single}
                item={frameList[i]}
                number={runnerNum}
                currentFrame={currentFrame}
                active={isActive}
                rem={rem}
              />
            )}
          </div>
        ))}
      </motion.div>

      <div
        className="absolute right-4 duration-1000"
        style={{ top: (screenHeight < 700 ? 5 : 7.5) * rem, opacity: leadRunner ? 1 : 0 }}
      >
        {runnerCountList.map((runnerNum) => (
          <div
            key={runnerNum}
            className={clsx(
              'flex items-center duration-200 pb-0.5 relative',
              single ? 'h-15 pb-0.75' : 'h-10 pb-0.5',
              leadRunner === runnerNum ? 'text-[#FF4D00] scale-125' : 'text-white scale-100'
            )}
          >
            {betRunners.includes(runnerNum) && <BetTagIcon />}
            <svg
              className={single ? 'size-3' : 'size-2'}
              viewBox="0 0 8 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.07143 5.48462C-0.0714271 4.82479 -0.071428 3.17521 1.07143 2.51538L4.92857 0.288462C6.07143 -0.371366 7.5 0.45342 7.5 1.77308L7.5 6.22692C7.5 7.54658 6.07143 8.37137 4.92857 7.71154L1.07143 5.48462Z"
                fill="currentColor"
              />
            </svg>
            <span className={clsx('font-bold', single ? 'text-base ml-1.5' : 'text-xs ml-1')}>
              {runnerNum}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
