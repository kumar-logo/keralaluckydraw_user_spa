import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Modal, ModalContent } from '@nextui-org/react'
import { useAudio } from '../../hooks/useAudio'

interface SnackBarProps {
  transparentBg?: boolean
}

export interface SnackBarRef {
  show: () => void
  hide: () => void
}

export const SnackBar = forwardRef<SnackBarRef, SnackBarProps>(({ transparentBg }, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const lottieRef = useRef<any>(null)
  const audio = useAudio('/audio/cut-down.mp3')

  useImperativeHandle(ref, () => ({
    show: () => {
      if (!isOpen) setIsOpen(true)
    },
    hide: () => {
      audio.stop()
      setIsOpen(false)
    },
  }))

  useEffect(() => {
    const el = lottieRef.current
    if (!isOpen || !el) return

    const onReady = () => audio.play()
    const onComplete = () => requestAnimationFrame(() => setIsOpen(false))

    el.addEventListener('ready', onReady)
    el.addEventListener('complete', onComplete)
    return () => {
      el.removeEventListener('ready', onReady)
      el.removeEventListener('complete', onComplete)
    }
  }, [isOpen])

  return (
    <Modal
      classNames={{
        base: 'bg-transparent shadow-none',
        backdrop: transparentBg ? 'bg-transparent' : '',
      }}
      isOpen={isOpen}
      hideCloseButton
    >
      <ModalContent>
        <div className="game-cut-down-canvas">
          <lottie-player
            ref={lottieRef}
            src="/json/countdown.json"
            autoplay
            renderer="svg"
          />
        </div>
      </ModalContent>
    </Modal>
  )
})

SnackBar.displayName = 'SnackBar'
