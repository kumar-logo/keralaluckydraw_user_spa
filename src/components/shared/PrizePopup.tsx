import { useState, useEffect, useRef } from 'react'
import { Modal, ModalContent, useDisclosure, Image } from '@nextui-org/react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { useAudio } from '../../hooks/useAudio'
import { formatCurrency } from '../../utils/format'
import { fetchJsonCached } from '../../utils/jsonCache'

const getJackpotLottie = () => fetchJsonCached('/json/jackpot-celebration.json')

const PrizeContainer = ({
  scale,
  size,
  children,
  text,
}: {
  scale: number
  size: 'md' | 'sm'
  children: React.ReactNode
  text: string
}) => (
  <div
    className={clsx(
      'flex flex-col items-center duration-300 ease-out justify-center relative bg-cover bg-no-repeat',
      size === 'md' ? 'size-80' : 'size-40'
    )}
    style={{
      backgroundImage: 'url(/images/common/prize-win-bg.webp)',
      transform: `scale(${scale})`,
      backgroundSize: size === 'md' ? '20rem 20rem' : '12rem 12rem',
      backgroundPosition: 'center center',
    }}
  >
    <div
      className={clsx(
        'flex items-center justify-center w-full absolute',
        size === 'md' ? 'top-5 text-4xl' : 'top-0 text-3xl'
      )}
    >
      <div
        className="text-[#FFC43B] font-black din"
        style={{ textShadow: '0 4px 4px rgba(0, 0, 0, 0.80)' }}
      >
        {text}
      </div>
    </div>
    {children}
  </div>
)

const CashPrizeDisplay = ({
  scale,
  prize,
  isCash,
  size = 'md',
}: {
  scale: number
  prize: number
  isCash: boolean
  size?: 'md' | 'sm'
}) => (
  <PrizeContainer
    scale={scale}
    size={size}
    text={formatCurrency({ amount: prize, precision: 0, hideSymbol: !isCash })}
  >
    <Image alt="coin" src="/images/common/coin.webp" className="w-24.25 h-16.25" />
  </PrizeContainer>
)

const SpinPrizeDisplay = ({
  scale,
  spin,
  size = 'md',
}: {
  scale: number
  spin: number
  size?: 'md' | 'sm'
}) => (
  <PrizeContainer scale={scale} size={size} text={'× ' + spin}>
    <Image
      alt="spin"
      src="/images/common/spin.webp"
      className={size === 'md' ? 'w-34 h-36' : 'w-17 h-18'}
    />
  </PrizeContainer>
)

function useRegularPrize() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure()
  const audio = useAudio('/audio/win.mp3')
  const [isCash, setIsCash] = useState(true)
  const [amount, setAmount] = useState(0)
  const [spin, setSpin] = useState(0)
  const [scale, setScale] = useState(0)
  const [isDismissable, setIsDismissable] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = (
    data: { amount: number; spin: number; tickets: number },
    cash = true,
    autoClose: boolean | number = false
  ) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsCash(cash)
    setAmount(data.amount)
    setSpin(data.spin)
    setIsDismissable(!!autoClose)
    setScale(0)
    setTimeout(() => setScale(1), 200)
    onOpen()
    if (autoClose) {
      timerRef.current = setTimeout(
        () => onClose(),
        typeof autoClose === 'number' ? autoClose : 2000
      )
    }
  }

  useEffect(() => {
    if (isOpen) audio.play()
  }, [isOpen])

  return {
    render: (
      <Modal
        placement="center"
        backdrop="opaque"
        classNames={{
          base: 'm-0 bg-transparent shadow-none',
          wrapper: 'fixed z-60',
          backdrop: 'z-55',
        }}
        radius="none"
        hideCloseButton
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        isDismissable={isDismissable}
      >
        <ModalContent
          className={clsx(
            'flex flex-col items-center',
            isDismissable && 'pointer-events-none'
          )}
        >
          <div className="flex items-center justify-around">
            {amount ? (
              <CashPrizeDisplay
                scale={scale}
                prize={amount}
                isCash={isCash}
                size={spin ? 'sm' : 'md'}
              />
            ) : (
              <></>
            )}
            {spin ? (
              <SpinPrizeDisplay scale={scale} spin={spin} size={amount ? 'sm' : 'md'} />
            ) : (
              <></>
            )}
          </div>
          {!isDismissable && (
            <Image
              src="/images/common/get.webp"
              onClick={onClose}
              alt="get"
              className={clsx('w-24.5 h-9.5', amount && spin && 'mt-8')}
              removeWrapper
            />
          )}
        </ModalContent>
      </Modal>
    ),
    show,
    hide: onClose,
  }
}

function useJackpotPrize() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure()
  const audio = useAudio('/audio/run-winner.mp3')
  const [isCash, setIsCash] = useState(true)
  const [amount, setAmount] = useState(0)
  const [isDismissable, setIsDismissable] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [lottieSrc, setLottieSrc] = useState<string | null>(null)

  useEffect(() => {
    getJackpotLottie().then((d: any) => setLottieSrc(JSON.stringify(d)))
  }, [])

  const show = (
    prize: number,
    cash = true,
    autoClose: boolean | number = false
  ) => {
    setIsCash(cash)
    setAmount(prize)
    setIsDismissable(!!autoClose)
    onOpen()
    if (timerRef.current) clearTimeout(timerRef.current)
    if (autoClose) {
      timerRef.current = setTimeout(
        () => onClose(),
        typeof autoClose === 'number' ? autoClose : 3000
      )
    }
  }

  useEffect(() => {
    if (isOpen) audio.play()
  }, [isOpen])

  return {
    render: (
      <Modal
        placement="center"
        backdrop="opaque"
        classNames={{
          base: 'm-0 bg-transparent shadow-none',
          wrapper: 'fixed z-60',
          backdrop: 'z-55',
        }}
        radius="none"
        hideCloseButton
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        isDismissable={isDismissable}
      >
        <ModalContent className="flex flex-col items-center">

          {lottieSrc && (
            <lottie-player src={lottieSrc} autoplay />
          )}
          <motion.span
            className="absolute text-5xl text-[#FFC43B] font-black din bottom-76"
            style={{ textShadow: '0 4px 4px rgba(0, 0, 0, 0.80)' }}
            initial={{ scale: 0 }}
            animate={{ scale: isOpen ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
          >
            {formatCurrency({ amount, precision: 0, hideSymbol: !isCash })}
          </motion.span>
          {!isDismissable && (
            <Image
              src="/images/common/get.webp"
              onClick={onClose}
              alt="get"
              className="absolute w-24.5 h-9.5 bottom-50"
              removeWrapper
            />
          )}
        </ModalContent>
      </Modal>
    ),
    show,
    hide: onClose,
  }
}

export const PrizeEventHandler = () => {
  const regular = useRegularPrize()
  const jackpot = useJackpotPrize()

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const amount = Number(detail.amount) || 0
      const spin = Number(detail.spin) || 0
      const tickets = Number(detail.tickets) || 0
      const isCash = detail.isCash
      const autoClose = detail.autoClose
      const jackpotCutoff = detail.jackpotCutoff ?? 100

      if (!amount && !spin && !tickets) return

      if (amount >= jackpotCutoff && !spin && !tickets) {
        jackpot.show(amount, isCash, autoClose)
      } else {
        regular.show({ amount, spin, tickets }, isCash, autoClose)
      }
    }

    window.addEventListener('showBouns', handler)
    return () => window.removeEventListener('showBouns', handler)
  }, [])

  return (
    <>
      {regular.render}
      {jackpot.render}
    </>
  )
}
