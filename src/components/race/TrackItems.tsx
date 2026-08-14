import { memo, useState, useEffect, useRef, useMemo, type Ref } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import clsx from 'clsx'
import { RaceSpriteIcon } from './RaceSpriteIcon'
import { PlayerBadge } from './Badges'
import { getRunnerState } from '../../config/raceConstants'
import type { RaceFrameObstacle, RaceRunnerFrameDto } from '../../services/raceApi'
import lottieBaseData from '../../data/lottie-base.json'
import { leftPosition, LINEAR_EASE } from './trackHelpers'

export const TrackObstacle = memo(({ item, hide, single }: { item: RaceFrameObstacle; hide: boolean; single: boolean }) => {
  const [isMud, leftRem] = [item.speedModulus < 1, item.point * 0.15 + 1.75 + 'rem']
  return (
    <div
      className={clsx('flex items-center absolute duration-300', single ? 'h-20 w-9' : 'h-10 w-6')}
      style={{ left: leftRem, opacity: hide ? 0 : 1 }}
    >
      {isMud ? (
        <RaceSpriteIcon scale={single ? 1.5 : 1} pos="mud" className={clsx('rotate-90', single ? 'w-6 h-12' : 'w-4 h-8')} />
      ) : (
        <RaceSpriteIcon scale={single ? 1.5 : 1} pos="redbull" className={single ? 'size-9' : 'size-6'} />
      )}
    </div>
  )
})

export const RunnerShadow = memo(({ hide, single }: { hide: boolean; single: boolean }) => (
  <RaceSpriteIcon
    pos="shadow"
    scale={single ? 1.5 : 1}
    className={clsx('absolute bottom-2 duration-200 delay-200', single ? 'w-8.25 h-2.25 left-2.25' : 'w-5.5 h-1.5 left-1.5 ')}
    style={{ opacity: hide ? 0 : 1 }}
  />
))

export const RunnerHaze = memo(({ hide, single }: { hide: boolean; single: boolean }) => (
  <RaceSpriteIcon
    pos="haze"
    scale={single ? 1.5 : 1}
    className={clsx('absolute top-0 duration-200 delay-200', single ? 'w-12 h-21 left-1' : 'w-8 h-14 left-0')}
    style={{ opacity: hide ? 0 : 1 }}
  />
))

export const AccelerationEffect = memo(({ hide, single }: { hide: boolean; single: boolean }) => (
  <RaceSpriteIcon
    pos="acceleration"
    scale={single ? 1.5 : 1}
    className={clsx('absolute top-0 duration-200 delay-200', single ? 'w-18.75 h-21 -left-3' : 'w-12.5 h-14 -left-3')}
    style={{ opacity: hide ? 0 : 1 }}
  />
))

const WINNER_BG_SPRITES: Record<number, string> = { 0: 'top1bg', 1: 'top2bg', 2: 'top3bg' }

export const WinnerOverlay = ({ top, number, no, single }: { top: string; number: number; no: number; single: boolean }) => {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setVisible(true) }, [])
  return (
    <RaceSpriteIcon
      scale={single ? 1.5 : 1}
      pos={WINNER_BG_SPRITES[no]}
      className={clsx('absolute duration-500 z-10 flex items-center pl-2.5', single ? 'w-38.25 h-10.5' : 'w-25.5 h-7')}
      style={{ right: visible ? '7rem' : 0, opacity: visible ? 1 : 0, top }}
    >
      <PlayerBadge state={getRunnerState(number, single)} />
      <span className={clsx('font-black text-white ml-1', single ? 'text-xl' : 'text-sm')}>
        {number}
      </span>
    </RaceSpriteIcon>
  )
}

const buildLottieSrc = (runnerNumber: number) => {
  let folder = 'kerala/'
  if (runnerNumber > 2)
    switch (runnerNumber) {
      case 3:
      case 4:
        folder = 'tamil/'
        break
      case 5:
      case 6:
        folder = 'madhya-pradesh/'
        break
      case 7:
      case 8:
        folder = 'maharashtra/'
        break
      case 9:
      case 10:
        folder = 'karnataka/'
        break
      case 11:
      case 12:
        folder = 'nagaland/'
        break
    }
  const data = JSON.parse(JSON.stringify(lottieBaseData)) as { assets: { u: string }[] }
  data.assets.forEach((asset) => { asset.u += folder })
  return JSON.stringify(data)
}

export const LottieRunner = ({ speed, ref, number }: { speed: number; ref: Ref<LottiePlayerElement>; number: number }) => {
  const src = useMemo(() => buildLottieSrc(number), [number])
  return <lottie-player speed={speed} ref={ref} src={src} loop />
}

export const AnimatedRunner = ({ item, currentFrame, active, number, rem, single }: {
  item: RaceRunnerFrameDto; currentFrame: number; active: boolean; number: number; rem: number; single: boolean
}) => {
  const controls = useAnimationControls()
  const lottieRef = useRef<LottiePlayerElement>(null)
  const [speed, setSpeed] = useState(2)
  const frameData = useMemo(
    () => item.frameData[currentFrame] || { speedStatus: 0, point: 0 },
    [currentFrame, item.frameData]
  )

  useEffect(() => {
    if (frameData.point) controls.start(leftPosition(frameData.point * 0.15 * rem), LINEAR_EASE)
    else controls.set(leftPosition(0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameData])

  useEffect(() => {
    setSpeed(frameData.speedStatus === 0 ? 2 : frameData.speedStatus > 0 ? 2.5 : 1.5)
  }, [frameData.speedStatus])

  useEffect(() => {
    if (active && currentFrame >= 479) lottieRef.current?.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFrame])

  useEffect(() => {
    if (active) lottieRef.current?.play()
    else lottieRef.current?.stop()
  }, [active])

  return (
    <motion.div
      animate={controls}
      className={clsx('relative overflow-visible will-change-auto', single ? 'w-12 h-21 mb-6' : 'w-8 h-14 mb-3')}
    >
      <RunnerHaze hide={frameData?.speedStatus >= 0} single={single} />
      <LottieRunner speed={speed} ref={lottieRef} number={number * (single ? 2 : 1)} />
      <RunnerShadow hide={frameData?.speedStatus >= 0} single={single} />
      <AccelerationEffect hide={frameData?.speedStatus <= 0} single={single} />
    </motion.div>
  )
}
