import { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react'
import { Modal, ModalContent, useDisclosure } from '@nextui-org/react'
import { useAudio } from '../../hooks/useAudio'
import { fetchJsonCached } from '../../utils/jsonCache'
import { DigitScroll, DigitScrollRef } from '../shared/DigitScroll'

const makeColumn = () =>
  Array.from({ length: 10 }, (_, i) => i)
    .reverse()
    .map((n) => (
      <div
        key={n}
        className="h-19.5 w-full flex-1 flex items-center justify-center text-6xl font-bold din text-black"
      >
        {n}
      </div>
    ))

const digitGroup = [makeColumn(), makeColumn(), makeColumn(), makeColumn(), makeColumn()]

export interface FourFiveDigitDrawAnimationRef {
  start: () => void
  stop: (digits: number[], onComplete?: () => void) => void
}

export const FourFiveDigitDrawAnimation = forwardRef<FourFiveDigitDrawAnimationRef>(
  (_props, ref) => {
    const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure()
    const lottieRef = useRef<LottiePlayerElement>(null)
    const scrollRef = useRef<DigitScrollRef>(null)
    const audio = useAudio('/audio/scroll.mp3')
    const [lottieSrc, setLottieSrc] = useState<string | null>(null)

    useEffect(() => {
      fetchJsonCached('/json/5d-draw.json')
        .then((d) => setLottieSrc(JSON.stringify(d)))
        .catch(() => {})
    }, [])

    const start = () => {
      onOpen()
      setTimeout(() => {
        lottieRef.current?.play?.()
        setTimeout(() => {
          audio.play()
          scrollRef.current?.start?.()
        }, 500)
      }, 50)
    }

    const stop = (digits: number[], onComplete?: () => void) => {
      scrollRef.current?.stop?.(digits)
      setTimeout(() => {
        onClose()
        onComplete?.()
      }, 3000)
    }

    useImperativeHandle(ref, () => ({ start, stop }))

    return (
      <Modal
        isOpen={isOpen}
        isDismissable={false}
        onOpenChange={onOpenChange}
        hideCloseButton
        placement="center"
      >
        <ModalContent className="bg-transparent shadow-none w-full m-0! h-150 rounded-none">
          {lottieSrc && (
            <lottie-player src={lottieSrc} loop ref={lottieRef} />
          )}
          <DigitScroll
            ref={scrollRef}
            group={digitGroup}
            className="absolute left-17.5 top-77.5 h-19.5 w-59"
            itemClassName="h-full flex-1"
          />
        </ModalContent>
      </Modal>
    )
  }
)

FourFiveDigitDrawAnimation.displayName = 'FourFiveDigitDrawAnimation'
