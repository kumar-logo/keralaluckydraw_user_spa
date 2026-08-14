import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Modal, ModalContent } from '@nextui-org/react'
import { redeemCdKey } from '../../services/hallApi'
import { toast } from '../../utils/toast'
import { fetchAndSyncBalance } from '../../utils/fetchBalance'

const TelegramIcon = () => (
  <svg
    className="size-full"
    viewBox="0 0 1024 1024"
    xmlns="http://www.w3.org/2000/svg"
    width={200}
    height={200}
  >
    <path
      d="M417.28 795.733333 429.226667 615.253333 756.906667 320C771.413333 306.773333 753.92 300.373333 734.72 311.893333L330.24 567.466667 155.306667 512C117.76 501.333333 117.333333 475.306667 163.84 456.533333L845.226667 193.706667C876.373333 179.626667 906.24 201.386667 894.293333 249.173333L778.24 795.733333C770.133333 834.56 746.666667 843.946667 714.24 826.026667L537.6 695.466667 452.693333 777.813333C442.88 787.626667 434.773333 795.733333 417.28 795.733333Z"
      fill="#176BE3"
    />
  </svg>
)

const GradientBorderButton = ({
  children,
  className,
  bgClass = 'bg-linear-primary-tb',
  disBgClass = 'bg-text-acc',
  borderClass = 'bg-white/40',
  disabled,
  ...rest
}: {
  children: React.ReactNode
  className?: string
  bgClass?: string
  disBgClass?: string
  borderClass?: string
  disabled?: boolean
  onPress?: () => void
}) => (
  <Button
    className={'rounded-full p-0 h-8 ' + (disabled ? disBgClass : bgClass) + (className ? ' ' + className : '')}
    isDisabled={disabled}
    {...rest}
  >
    <div className={'size-full font-bold p-px ' + borderClass}>
      <div className={'px-5 flex items-center size-full rounded-full ' + (disabled ? disBgClass : bgClass)}>
        {children}
      </div>
    </div>
  </Button>
)

export const GiftCodeDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRedeem = async () => {
    if (!code) return
    setLoading(true)
    try {
      const res: any = await redeemCdKey(code)
      toast.success(res?.tip || t('common.tip.info.giftCode.success'))
      fetchAndSyncBalance()
      setCode('')
      onClose()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(v) => { if (!v) { setCode(''); onClose() } }}
      hideCloseButton
      classNames={{
        base: 'rounded-sm',
        wrapper: 'z-60',
        backdrop: 'z-60',
      }}
      placement="center"
    >
      <ModalContent className="bg-transparent bg-[url(/images/common/gift-code-bg-light.webp)] dark:bg-[url(/images/common/gift-code-bg-dark.webp)] size-90 bg-cover bg-no-repeat justify-end items-center pb-6 px-12 shadow-none">
        <Input
          classNames={{
            inputWrapper: 'bg-light-gray! border border-gray dark:border-sec/40 rounded-sm h-12 px-3 py-2',
            input: 'text-sm leading-5 text-main font-bold placeholder:font-normal placeholder:text-sec-acc',
          }}
          placeholder={t('common.tip.info.giftCode.ph')}
          value={code}
          onValueChange={setCode}
        />
        <Button
          isLoading={loading}
          className="w-full bg-linear-primary-tb shadow-btn-primary h-13 rounded-full text-base font-bold text-black my-4"
          isDisabled={!code}
          onPress={handleRedeem}
        >
          {t('common.label.exchange')}
        </Button>
        <GradientBorderButton
          className="h-12 shrink-0 rounded-full w-full p-0.5 bg-primary"
          bgClass="bg-selected text-primary"
          onPress={() => {
            const tgLink = localStorage.getItem('tg_link')
            if (tgLink) window.open(tgLink, '_blank')
            else toast.warning(t('common.tip.info.plsWaitForLoad'))
          }}
        >
          <div className="size-6 mr-2 rtl:mr-0 rtl:ml-2">
            <TelegramIcon />
          </div>
          {t('common.tip.info.giftCode.getMore')}
        </GradientBorderButton>
      </ModalContent>
    </Modal>
  )
}
