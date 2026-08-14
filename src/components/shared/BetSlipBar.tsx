import { useRef, useImperativeHandle, forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure, Image } from '@nextui-org/react'
import clsx from 'clsx'
import { useUIStore } from '../../stores/uiStore'
import { AnimatedButton } from './AnimatedButton'
import { DeleteConfirm } from './DeleteConfirm'

interface BetSlipBarProps {
  children?: React.ReactNode
  price: React.ReactNode
  discountedPrice?: React.ReactNode
  quantity: number
  onConfirm?: () => void
  onClear?: () => Promise<boolean> | void
  isDisabled?: boolean
  isLoading?: boolean
  title?: React.ReactNode
  clearTip?: string
  disableTip?: string
  isDismissable?: boolean
  hideShadow?: boolean
  spacerClassName?: string
}

export interface BetSlipBarRef {
  shopCarImg: React.RefObject<HTMLDivElement | null>
  onOpenChange: () => void
  onOpen: () => void
  onClose: () => void
  isOpen: boolean
}

export const BetSlipBar = forwardRef<BetSlipBarRef, BetSlipBarProps>((props, ref) => {
  const { t } = useTranslation()
  const {
    children,
    price,
    discountedPrice,
    quantity,
    onConfirm,
    onClear,
    isDisabled = false,
    isLoading,
    title,
    clearTip = t('common.tip.confirm.clearNumbers'),
    disableTip,
    isDismissable = true,
    hideShadow,
    spacerClassName,
  } = props

  const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure()
  const shopCarImg = useRef<HTMLDivElement>(null)
  const screenWidth = useUIStore((s) => s.screenWidth)

  useImperativeHandle(
    ref,
    () => ({
      shopCarImg,
      onOpenChange,
      onOpen,
      onClose,
      isOpen,
    }),
    [onOpenChange, onOpen, onClose, isOpen]
  )

  return (
    <>
      <div className={clsx('h-[calc(var(--nav-bar-height)+4rem)] min-h-[calc(var(--nav-bar-height)+4rem)]', spacerClassName)}>
        <div
          className="flex h-[calc(var(--nav-bar-height)+4rem)] w-full items-center justify-between p-3 fixed bottom-0 z-60 bg-white dark:bg-gray"
          style={{
            boxShadow: hideShadow ? '' : '0px -1px 12px 0px rgba(0, 0, 0, 0.25)',
            maxWidth: screenWidth,
            paddingBottom: 'calc(var(--nav-bar-height) + 0.75rem)',
          }}
        >
          <div
            className="flex items-center cursor-pointer"
            onClick={() => {
              if (children) onOpenChange()
            }}
          >
            <div className="size-9 mr-2" ref={shopCarImg}>
              <Image src="/images/common/shop-car.webp" alt="cart" className="h-8 w-8 rounded-none" />
            </div>
            <div className="flex flex-col">
              {discountedPrice ? (
                <span className="text-red-500 font-black leading-4">
                  <span className="text-main font-bold leading-4 line-through decoration-[1.25px] mr-1">
                    {price}
                  </span>
                  {discountedPrice}
                </span>
              ) : (
                <span className="text-main font-bold leading-4">{price}</span>
              )}
              <span className="text-acc text-xs">
                {quantity} BIDS
              </span>
            </div>
          </div>
          <AnimatedButton
            disabled={isDisabled || quantity === 0}
            isDisabled={isDisabled || quantity === 0}
            isLoading={isLoading}
            className="text-black font-bold rounded-lg px-5 bg-linear-primary-tb shadow-btn-primary"
            onPress={() => onConfirm?.()}
            tip={disableTip}
          >
            {t('common.label.games.payNow')}
          </AnimatedButton>
        </div>
      </div>
      <Modal
        isDismissable={isDismissable}
        isOpen={isOpen}
        backdrop="blur"
        placement="bottom"
        hideCloseButton
        onOpenChange={onOpenChange}
      >
        <ModalContent
          className="m-0 rounded-none rounded-t-lg h-[calc(50dvh+4rem)] max-h-[80dvh] sm:my-0 sm:mx-0"
          style={{ maxWidth: screenWidth }}
        >
          <ModalHeader className="p-3 pb-2 text-sm justify-between">
            <div>{title}</div>
            {quantity > 0 && (
              <DeleteConfirm tipKey={clearTip} onDel={onClear!} />
            )}
          </ModalHeader>
          <ModalBody className="p-0 pb-16 overflow-auto">
            <div className="flex flex-col px-3 flex-1 w-full overflow-auto">
              {children}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
})

BetSlipBar.displayName = 'BetSlipBar'
