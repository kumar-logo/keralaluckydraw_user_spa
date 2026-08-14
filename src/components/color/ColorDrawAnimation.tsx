import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Modal, ModalContent, useDisclosure } from '@nextui-org/react'
import { useAudio } from '../../hooks/useAudio'
import { ColorDrawDigit } from './ColorDrawDigit'

const SPRITE_BASE = {
  backgroundImage: 'url(/images/games/wingo/draw-sprite.webp)',
  backgroundSize: '55.5rem 33.125rem',
}

const FRAME_STYLE = { ...SPRITE_BASE, backgroundPosition: 'right 0 top 0' }
const WHEEL_STYLE = { ...SPRITE_BASE, backgroundPosition: '0 -8.75rem' }

const DIGIT_ORDER = [0, 1, 2, 3, 4, 9, 8, 7, 6, 5]
const POSITION_REMAP: Record<number, number> = { 5: 9, 6: 8, 8: 6, 9: 5 }

export interface ColorDrawAnimationRef {
  open: () => void
  close: (result: string | number) => void
}

export const ColorDrawAnimation = forwardRef<ColorDrawAnimationRef>((_, ref) => {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure()
  const [currentDigit, setCurrentDigit] = useState(0)
  const currentRef = useRef(0)
  const isRunning = useRef(false)
  const dRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const targetRef = useRef(-1)
  const audio = useAudio('/audio/wingo-draw.mp3')
  const gridRef = useRef<HTMLDivElement>(null)
  const [flyStyle, setFlyStyle] = useState<React.CSSProperties>()
  const [flyData, setFlyData] = useState<{ digit: number; x: number; y: number }>()

  const clearTimer = (t = timeoutRef.current) => {
    if (t) clearTimeout(t)
  }

  const stop = () => {
    isRunning.current = false
    audio.stop()
    onClose()
  }

  const onLand = () => {
    const el = gridRef.current?.querySelector(`[data-digit="${currentRef.current}"]`) as HTMLElement
    if (!el) return stop()
    const { left, top, height, width } = el.getBoundingClientRect()
    const dataX = el.getAttribute('data-x')
    const dataY = el.getAttribute('data-y')
    if (!dataX || !dataY) return stop()

    setFlyStyle(() => ({ left, top, transform: 'scale(0)' }))
    setFlyData(() => ({ digit: currentRef.current, x: parseInt(dataX), y: parseInt(dataY) }))

    setTimeout(() => {
      setFlyStyle(() => ({
        left: (window.innerWidth - width) / 2,
        top: (window.innerHeight - height) / 2,
        transform: 'scale(3.8)',
      }))
      setTimeout(() => stop(), 2000)
    }, 500)
  }

  const close = (result: string | number) => {
    if (!isRunning.current) return
    let idx = DIGIT_ORDER.indexOf(result as number)
    idx = POSITION_REMAP[idx] ?? idx
    targetRef.current = idx
    clearTimer()

    let steps = targetRef.current - currentRef.current + (targetRef.current > currentRef.current ? 10 : 0)
    steps = steps < 4 ? steps + 10 : steps
    const inc = 400 / steps
    const delays = Array.from({ length: steps }, (_, i) => Math.round(100 + inc * i + 1))
    let step = 0

    const animate = () => {
      setTimeout(() => {
        if (step < delays.length - 1) step++
        else return onLand()
        setCurrentDigit((d) => { currentRef.current = d < 9 ? d + 1 : 0; return currentRef.current })
        animate()
      }, delays[step])
    }
    requestAnimationFrame(animate)
  }

  const open = () => {
    if (isRunning.current) return
    isRunning.current = true
    setCurrentDigit(0)
    currentRef.current = 0
    setFlyStyle(undefined)
    setFlyData(undefined)
    onOpen()
    clearTimer()
    dRef.current = performance.now()
    targetRef.current = -1

    let delay = 310
    const spin = () => {
      if (targetRef.current > -1) return
      setTimeout(() => {
        if (delay > 100) delay -= 70
        setCurrentDigit((d) => { currentRef.current = d < 9 ? d + 1 : 0; return currentRef.current })
        spin()
      }, delay)
    }

    setTimeout(() => {
      audio.play()
      spin()
    }, 200)

    timeoutRef.current = setTimeout(() => stop(), 5500)
  }

  useImperativeHandle(ref, () => ({ open, close }))

  useEffect(() => () => clearTimer(), [])

  return (
    <Modal
      isOpen={isOpen}
      isDismissable={false}
      onOpenChange={onOpenChange}
      hideCloseButton
      placement="center"
    >
      <ModalContent className="bg-transparent shadow-none rounded-none size-93.75 m-0 flex justify-center items-center overflow-visible">
        <div
          className="size-132.25 absolute -left-19.25 -top-19.25 animate-rotate animate-infinite animate-duration-8 z-0"
        >
          <div className="size-full animate-duration-300 animate-scale">
            <div
              className="size-full bg-contain bg-no-repeat animate-scale animate-infinite scale-start-100 scale-via-90"
              style={FRAME_STYLE}
            />
          </div>
        </div>
        <div className="size-75 bg-contain flex flex-col items-center justify-end pb-20.25 relative z-10" style={WHEEL_STYLE}>
          <div ref={gridRef} className="p-3 grid grid-cols-5 gap-y-3 gap-x-2">
            {DIGIT_ORDER.map((n, idx) => (
              <ColorDrawDigit
                key={n}
                digit={n}
                x={idx % 5}
                y={idx > 4 ? 1 : 0}
                active={n === currentDigit}
              />
            ))}
          </div>
          {flyData && flyStyle && (
            <div className="duration-500 fixed size-8.5" style={flyStyle}>
              <ColorDrawDigit digit={flyData.digit} x={flyData.x} y={flyData.y} />
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  )
})

ColorDrawAnimation.displayName = 'ColorDrawAnimation'
