import { useRef, useEffect } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { Modal, ModalContent, useDisclosure } from '@nextui-org/react'
import { stateColors, getRunnerState, RaceRunner } from '../../config/raceConstants'
import { PlayerBadge } from './Badges'
import { formatCurrency } from '../../utils/format'
import { useAudio } from '../../hooks/useAudio'

const SPRITE_SIZE = '23.375rem 30.25rem'
const SPRITE_IMAGE = 'url(/images/race/top3-bg.webp)'

export const WinnerDisplay = ({ winnerList, prize, onFinish, single, raceRunners, colors }: {
  winnerList: number[]
  prize: number | undefined
  onFinish: () => void
  single: boolean
  raceRunners?: RaceRunner[] | null
  colors?: string[]
}) => {
  const palette = colors && colors.length ? colors : stateColors
  const lottieRef = useRef<any>(undefined)
  const { isOpen, onClose, onOpen } = useDisclosure()
  const scaleControls = useAnimationControls()
  const rotateControls = useAnimationControls()
  const audio = useAudio('/audio/run-winner.mp3')

  useEffect(() => {
    if (winnerList.length === 3) {
      onOpen()
      const animationTimer = setTimeout(() => {
        rotateControls.start(
          { rotate: [0, 45, 90, 135, 180, 225], scale: [0.95, 1, 0.95, 1, 0.95, 1, 0.95] },
          { ease: 'linear', duration: 6, repeat: Infinity }
        )
        scaleControls.start(
          { scale: [0, 1] },
          { ease: 'easeOut', duration: 0.5 }
        )
        audio.play()
      }, 50)
      const closeTimer = setTimeout(() => {
        onClose()
        onFinish()
      }, 3500)
      return () => {
        clearTimeout(animationTimer)
        clearTimeout(closeTimer)
      }
    }
    onClose()
    lottieRef.current?.stop()
  }, [winnerList])

  useEffect(() => {
    if (winnerList.length === 3 && typeof prize === 'number' && prize > 0) {
      lottieRef.current?.play()
    }
  }, [prize, winnerList])

  return (
    <>
      <Modal isOpen={isOpen} isDismissable={false} placement="center" hideCloseButton>
        <ModalContent className="bg-transparent shadow-none size-93.5">
          <motion.div className="relative size-full" animate={scaleControls}>
            <motion.div
              animate={rotateControls}
              className="absolute size-full"
              style={{
                backgroundSize: SPRITE_SIZE,
                backgroundImage: SPRITE_IMAGE,
                backgroundPosition: '0 -6.875rem',
              }}
            />
            <div className="absolute left-0 top-0 size-full flex flex-col items-center justify-end pb-15">
              <div className="flex items-end -mb-2 relative z-10 text-white font-bold text-center text-lg leading-5.5">
                <div className="-mb-1 relative">
                  <div
                    className="w-9 h-5.5 rounded-sm absolute left-1/2 -ml-4.5 -top-3"
                    style={{ backgroundColor: palette[getRunnerState(winnerList[1], single)] }}
                  >
                    {winnerList[1]}
                  </div>
                  <PlayerBadge size={72} state={getRunnerState(winnerList[1], single)} raceRunners={raceRunners} />
                </div>
                <div className="mx-4 relative">
                  <div
                    className="w-9 h-6 rounded-sm leading-6 absolute left-1/2 -ml-4.5 -top-3"
                    style={{ backgroundColor: palette[getRunnerState(winnerList[0], single)] }}
                  >
                    {winnerList[0]}
                  </div>
                  <PlayerBadge size={91} state={getRunnerState(winnerList[0], single)} raceRunners={raceRunners} />
                </div>
                <div className="-mb-1 relative">
                  <div
                    className="w-9 h-5.5 rounded-sm absolute left-1/2 -ml-4.5 -top-3"
                    style={{ backgroundColor: palette[getRunnerState(winnerList[2], single)] }}
                  >
                    {winnerList[2]}
                  </div>
                  <PlayerBadge size={72} state={getRunnerState(winnerList[2], single)} raceRunners={raceRunners} />
                </div>
              </div>
              <div
                className="w-73.5 h-27.5 flex justify-center items-end"
                style={{ backgroundSize: SPRITE_SIZE, backgroundImage: SPRITE_IMAGE }}
              >
                <p className="flex items-center mb-2">
                  {typeof prize !== 'number' ? null : prize > 0 ? (
                    <>
                      <span className="text-sm text-white mr-1">WIN</span>
                      <span className="text-lg font-black text-[#ffea07]">{formatCurrency(prize, 0)}</span>
                    </>
                  ) : (
                    <span className="text-sm text-white mr-1 leading-7"> NO WIN</span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        </ModalContent>
      </Modal>
      <div className="fixed size-full left-0 top-0 z-54 pointer-events-none">
        <lottie-player ref={lottieRef} src="/json/finish.json" />
      </div>
    </>
  )
}
