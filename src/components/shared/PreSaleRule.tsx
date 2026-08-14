import { useTranslation } from 'react-i18next'
import { Modal, ModalContent, useDisclosure } from '@nextui-org/react'

interface UsePreSaleRuleProps {
  onClose?: () => void
}

export function usePreSaleRule(props?: UsePreSaleRuleProps) {
  const { isOpen, onOpen, onOpenChange, onClose: _onClose } = useDisclosure()
  const { t } = useTranslation()

  const handleClose = () => {
    _onClose()
    props?.onClose?.()
  }

  return {
    render: (
      <Modal
        placement="center"
        backdrop="opaque"
        classNames={{
          base: 'm-0 rounded-lg p-5 bg-white dark:bg-gray w-90 h-[70%]',
        }}
        radius="none"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onClose={handleClose}
        hideCloseButton
      >
        <ModalContent>
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex justify-between items-center pb-3">
              <span className="text-base font-bold text-main">{t('pay.label.saleRules.title')}</span>
              <div className="pre-sale-close text-sec-acc" onClick={handleClose}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M16.8359 8.70685C17.2265 8.31632 17.2265 7.68316 16.8359 7.29264C16.4454 6.90212 15.8122 6.90213 15.4217 7.29266L12.0644 10.65L8.70712 7.29266C8.3166 6.90213 7.68343 6.90212 7.2929 7.29264C6.90237 7.68316 6.90237 8.31632 7.29288 8.70685L10.6502 12.0643L7.29288 15.4217C6.90237 15.8122 6.90237 16.4454 7.2929 16.8359C7.68343 17.2264 8.3166 17.2264 8.70712 16.8359L12.0644 13.4785L15.4217 16.8359C15.8122 17.2264 16.4454 17.2264 16.8359 16.8359C17.2265 16.4454 17.2265 15.8122 16.8359 15.4217L13.4786 12.0643L16.8359 8.70685Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto text-sm text-sec *:mb-5">
              <p>{t('pay.label.saleRules.p1')}</p>
              <p>{t('pay.label.saleRules.p2')}</p>
              <p>{t('pay.label.saleRules.p3')}</p>
              <p>{t('pay.label.saleRules.p4')}</p>
              <p>{t('pay.label.saleRules.p5')}</p>
              <p>{t('pay.label.saleRules.p6')}</p>
            </div>
          </div>
        </ModalContent>
      </Modal>
    ),
    show: onOpen,
    hide: handleClose,
  }
}
