import { useMemo } from 'react'
import { Modal, ModalContent, useDisclosure, ScrollShadow } from '@nextui-org/react'
import clsx from 'clsx'
import { CloseIcon } from './CloseIcon'

interface ModalConfig {
  hideCloseButton?: boolean
  placement?: 'auto' | 'bottom' | 'center' | 'top' | 'top-center' | 'bottom-center'
  [key: string]: any
}

interface ModalContentConfig {
  className?: string
  [key: string]: any
}

interface PopupModalProps {
  title: React.ReactNode
  titleClassName?: string
  closeIconClassName?: string
  children: React.ReactNode
  modalConfig?: ModalConfig
  modalContentConfig?: ModalContentConfig
}

const usePopupModal = ({
  title,
  titleClassName,
  closeIconClassName,
  children,
  modalConfig = { hideCloseButton: true, placement: 'center' },
  modalContentConfig = { className: 'p-5 m-2 max-h-[80dvh]' },
}: PopupModalProps) => {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure()
  const config = useMemo(
    () => ({
      placement: 'center' as const,
      ...modalConfig,
      hideCloseButton: true,
    }),
    [modalConfig]
  )

  return {
    open: onOpen,
    close: onClose,
    isOpen,
    render: (
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} {...config}>
        <ModalContent {...modalContentConfig}>
          <div className="flex items-center justify-between mb-3">
            <p className={clsx('text-main font-bold capitalize', titleClassName)}>{title}</p>
            <CloseIcon className={clsx('text-acc', closeIconClassName)} onClick={onClose} />
          </div>
          <ScrollShadow>{children}</ScrollShadow>
        </ModalContent>
      </Modal>
    ),
  }
}

interface PopupTooltipProps {
  children: React.ReactNode
  title: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  triggleRender: React.ReactNode
  modalConfig?: ModalConfig
  modalContentConfig?: ModalContentConfig
  [key: string]: any
}

export const PopupTooltip = ({
  children,
  title,
  onClick,
  triggleRender,
  modalConfig = { hideCloseButton: true, placement: 'center' },
  modalContentConfig = { className: 'p-5 m-2 max-h-[80dvh]' },
  ...props
}: PopupTooltipProps) => {
  const { render, open } = usePopupModal({
    title,
    children,
    modalConfig,
    modalContentConfig,
  })

  return (
    <>
      <div
        onClick={(e) => {
          open()
          onClick?.(e)
        }}
        {...props}
      >
        {triggleRender}
      </div>
      {render}
    </>
  )
}
