import { useTranslation } from 'react-i18next'
import { Image, Switch, Modal, ModalContent, useDisclosure } from '@nextui-org/react'
import { CloseIcon } from '../shared/CloseIcon'

const InfoCircleIcon = () => (
  <svg
    className="size-4"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.6568 13.6568C12.2091 15.1046 10.2091 16 8 16C5.79088 16 3.79088 15.1046 2.34314 13.6568C0.895432 12.2091 0 10.2091 0 8C0 5.79088 0.895432 3.79088 2.34314 2.34314C3.79088 0.895432 5.79088 0 8 0C10.2091 0 12.2091 0.895432 13.6568 2.34314C15.1046 3.79088 16 5.79088 16 8C16 10.2091 15.1046 12.2091 13.6568 13.6568ZM9 3.80002C9 3.24774 8.55228 2.80002 8 2.80002C7.44772 2.80002 7 3.24774 7 3.80002C7 4.3523 7.44772 4.80002 8 4.80002C8.55228 4.80002 9 4.3523 9 3.80002ZM6.60039 6.40002C6.60039 5.9582 6.95856 5.60002 7.40039 5.60002H7.80039H8.20039C8.64222 5.60002 9.00039 5.9582 9.00039 6.40002V11.2H9.6C10.0418 11.2 10.4 11.5582 10.4 12C10.4 12.4419 10.0418 12.8 9.6 12.8L8.20039 12.8L6.8 12.8C6.35817 12.8 6 12.4419 6 12C6 11.5582 6.35817 11.2 6.8 11.2H7.40039V7.20002C6.95856 7.20002 6.60039 6.84185 6.60039 6.40002Z"
      fill="currentColor"
    />
  </svg>
)

function useInsuranceRulesModal() {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure()

  const render = (
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
          <CloseIcon className="text-sec-acc" onClick={onClose} />
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
  )

  return { render, show: onOpen }
}

interface KeralaInsuranceToggleProps {
  isInsurance: boolean
  canInsurance?: boolean
  setIsInsurance: (v: boolean) => void
}

export function KeralaInsuranceToggle({
  isInsurance,
  canInsurance = false,
  setIsInsurance,
}: KeralaInsuranceToggleProps) {
  const { t } = useTranslation()
  const rules = useInsuranceRulesModal()

  return (
    <div
      className={
        'p-2 bg-linear-primary-tr text-black rounded-sm flex justify-between items-center' +
        (canInsurance ? '' : ' opacity-60')
      }
    >
      {rules.render}
      <div className="flex items-center">
        <Image
          src="/images/games/kerala-insurance.webp"
          alt="insurance"
          classNames={{
            wrapper: 'rounded-none size-10',
            img: 'size-full',
          }}
        />
        <div className="ml-2 ">
          <p className="text-sm font-bold">
            {t('common.label.games.FullInsurance')}
          </p>
          <p className="text-10 opacity-60">
            {t('common.tip.info.FullInsurance')}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end">
        <div
          className="text-xs mb-1 flex items-center"
          onClick={rules.show}
        >
          <InfoCircleIcon />
          <p className="ml-1">{t('common.label.Details')}</p>
        </div>
        {canInsurance ? (
          <Switch
            isSelected={isInsurance}
            onValueChange={setIsInsurance}
            size="sm"
            classNames={{
              wrapper: 'bg-text-acc p-0.5 h-4 mr-0 w-8',
              thumb: 'w-3 h-3',
            }}
          />
        ) : (
          <p className="text-xs">Wait For Next</p>
        )}
      </div>
    </div>
  )
}
