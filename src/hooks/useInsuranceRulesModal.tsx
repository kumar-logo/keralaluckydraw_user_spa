import { useTranslation } from 'react-i18next'
import { Modal, ModalContent, useDisclosure } from '@nextui-org/react'

export function useInsuranceRulesModal() {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure()

  return {
    renderModal: (
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        radius="sm"
        placement="center"
        hideCloseButton
      >
        <ModalContent className="p-4 mx-4">
          <div className="font-bold flex justify-between">
            {t('common.label.Details')}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text-sec-acc cursor-pointer"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              onClick={onClose}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M16.8359 8.70685C17.2265 8.31632 17.2265 7.68316 16.8359 7.29264C16.4454 6.90212 15.8122 6.90213 15.4217 7.29266L12.0644 10.65L8.70712 7.29266C8.3166 6.90213 7.68343 6.90212 7.2929 7.29264C6.90237 7.68316 6.90237 8.31632 7.29288 8.70685L10.6502 12.0643L7.29288 15.4217C6.90237 15.8122 6.90237 16.4454 7.2929 16.8359C7.68343 17.2264 8.3166 17.2264 8.70712 16.8359L12.0644 13.4785L15.4217 16.8359C15.8122 17.2264 16.4454 17.2264 16.8359 16.8359C17.2265 16.4454 17.2265 15.8122 16.8359 15.4217L13.4786 12.0643L16.8359 8.70685Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <ul className="mt-3 text-sm text-main list-disc pl-3">

            <li>{t('common.tip.info.fullInsuranceRule1')}:</li>
            <ul className="text-sec list-none mt-1 mb-3 text-xs">
              <li>{t('common.tip.info.fullInsuranceRule1-1')}</li>
              <li className="my-1">{t('common.tip.info.fullInsuranceRule1-2')}</li>
              <li>{t('common.tip.info.fullInsuranceRule1-3')}</li>
            </ul>

            <li>{t('common.tip.info.fullInsuranceRule2')}:</li>
            <ul className="text-sec list-none mt-1 mb-3 text-xs">
              <li>{t('common.tip.info.fullInsuranceRule2-1')}</li>
              <li className="mt-1">{t('common.tip.info.fullInsuranceRule2-2')}</li>
            </ul>

            <li>{t('common.tip.info.fullInsuranceRule3')}:</li>
            <ul className="text-sec list-none mt-1 mb-3 text-xs">
              <li>{t('common.tip.info.fullInsuranceRule3-1')}</li>
              <li className="my-1">{t('common.tip.info.fullInsuranceRule3-2')}</li>
              <li>{t('common.tip.info.fullInsuranceRule3-3')}</li>
              <li className="mt-1">{t('common.tip.info.fullInsuranceRule3-4')}</li>
            </ul>

            <li>{t('common.tip.info.fullInsuranceRule4')}:</li>
            <ul className="text-sec list-none mt-1 mb-3 text-xs">
              <li>{t('common.tip.info.fullInsuranceRule4-1')}</li>
              <li className="my-1">{t('common.tip.info.fullInsuranceRule4-2')}</li>
              <li>{t('common.tip.info.fullInsuranceRule4-3')}</li>
            </ul>
          </ul>
        </ModalContent>
      </Modal>
    ),
    show: onOpen,
  }
}
