import { useState, isValidElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, ModalContent, Button } from '@nextui-org/react'

interface ConfirmDialogProps {
  title: string
  subTitle?: React.ReactNode
  actionText?: string
  cancelText?: string
  onCancel?: () => void
  onConfirm?: () => Promise<boolean> | void
}

export const ConfirmDialog = ({
  title,
  subTitle,
  actionText = 'common.label.confirm',
  cancelText = 'common.label.cancel',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()

  return {
    render: (
      <Modal
        backdrop="blur"
        scrollBehavior="inside"
        placement="center"
        isDismissable={false}
        hideCloseButton
        isOpen={isOpen}
        style={{
          width: '16.875rem',
          borderRadius: '0.875rem',
          overflow: 'hidden',
        }}
      >
        <ModalContent className="bg-light-gray">
          <div
            className="p-4 flex flex-col text-center"
            style={{ borderBottom: '1px solid var(--bg-color-gray)' }}
          >
            <span className="font-medium text-base text-main">{title}</span>
            {isValidElement(subTitle) ? (
              subTitle
            ) : (
              <span className="text-xs mt-2 text-sec">{subTitle}</span>
            )}
          </div>
          <div className="flex">
            {cancelText && (
              <Button
                isDisabled={loading}
                className="flex-1 rounded-none bg-transparent"
                style={{ borderRight: '1px solid var(--bg-color-gray)' }}
                onPress={() => {
                  onCancel?.()
                  setIsOpen(false)
                }}
              >
                {t(cancelText)}
              </Button>
            )}
            <Button
              isLoading={loading}
              className="flex-1 rounded-none bg-transparent text-primary"
              onPress={() => {
                const result = onConfirm?.()
                if (result) {
                  setLoading(true)
                  result
                    .then((success) => {
                      if (success) setIsOpen(false)
                    })
                    .finally(() => setLoading(false))
                } else {
                  setIsOpen(false)
                }
              }}
            >
              {t(actionText)}
            </Button>
          </div>
        </ModalContent>
      </Modal>
    ),
    show: () => setIsOpen(true),
  }
}
