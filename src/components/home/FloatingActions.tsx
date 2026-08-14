import { useState, useMemo } from 'react'
import { Image, Modal, ModalContent } from '@nextui-org/react'
import clsx from 'clsx'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { useNotificationStore } from '../../stores/notificationStore'
import { useAppConfigStore } from '../../stores/configStore'

const NotifDot = ({ className }: { className?: string }) => (
  <div className={clsx('size-2.5 border border-white bg-danger rounded-full', className)} />
)

const PingDot = ({ className, ping, wapperClassName }: { className?: string; ping?: boolean; wapperClassName?: string }) =>
  ping ? (
    <div className={clsx('relative', wapperClassName)}>
      <NotifDot className={clsx('animate-ping absolute left-0 top-0', className)} />
      <NotifDot className={className} />
    </div>
  ) : (
    <NotifDot className={className} />
  )

const openCustomerService = () => {
  window.dispatchEvent(new CustomEvent('openCustomerService'))
}

const WHATSAPP_GLYPH =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'

const WhatsAppButton = ({ className }: { className?: string }) => {
  const enabled = useAppConfigStore((s) => s.support.whatsappEnabled)
  const url = useAppConfigStore((s) => s.support.whatsappUrl)
  if (!enabled || !url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp support"
      className={clsx('flex items-center justify-center rounded-full', className)}
      style={{ backgroundColor: '#25D366' }}
    >
      <svg viewBox="0 0 24 24" className="size-8" fill="#ffffff">
        <path d={WHATSAPP_GLYPH} />
      </svg>
    </a>
  )
}

const FirstRechargeButton = () => {
  const isRecharge = useAuthStore((s) => s.isRecharge ?? true)
  const rechargeBonusEnabled = useAppConfigStore((s) => s.rechargeBonusEnabled)
  const [showModal, setShowModal] = useState(false)
  const openRecharge = () => window.dispatchEvent(new CustomEvent('openRechargeDraw'))

  if (!rechargeBonusEnabled) return null

  return (
    <>
      {isRecharge ? (
        <div
          className="w-14 h-16 relative overflow-visible"
          onClick={() => setShowModal(true)}
        >
          <lottie-player
            src="/json/home-first-recharge-lottie-v4.json"
            className="w-14 h-16"
            autoplay
            loop
          />
        </div>
      ) : (
        <Image
          onClick={() => openRecharge()}
          src="/images/home/recharge-pop.webp"
          className="size-14"
          removeWrapper
        />
      )}
      <Modal
        isOpen={showModal}
        onOpenChange={(v) => { if (!v) setShowModal(false) }}
        hideCloseButton
        classNames={{
          base: 'm-0 bg-transparent shadow-none rounded-none',
          wrapper: 'z-210',
          backdrop: 'z-210',
        }}
        radius="none"
        placement="center"
      >
        <ModalContent className="flex flex-col items-center">
          <Image
            src="/images/home/first-recharge-modal-bg-v4.webp"
            onClick={() => {
              setShowModal(false)
              openRecharge()
            }}
          />
        </ModalContent>
      </Modal>
    </>
  )
}

const CsPingDot = ({ className, wapperClassName }: { className?: string; wapperClassName?: string }) => {
  const unreaderCSmsg = useNotificationStore((s) => s.unreaderCSmsg)
  if (!unreaderCSmsg) return <></>
  return <PingDot className={className} wapperClassName={wapperClassName} ping />
}

const CustomerServiceButton = ({ className }: { className?: string }) => {
  const enabled = useAppConfigStore((s) => s.support.chatEnabled)
  if (!enabled) return null
  return (
    <div className={clsx('relative', className)}>
      <div className="absolute right-1 top-1 z-15">
        <CsPingDot />
      </div>
      <Image
        onClick={() => openCustomerService()}
        radius="full"
        src="/images/common/cs.webp"
        className="size-full rounded-full"
      />
    </div>
  )
}

interface FloatingActionsProps {
  hide?: boolean
}

export const FloatingActions = ({ hide = false }: FloatingActionsProps) => {
  const rtl = useUIStore((s) => s.rtl)
  const rechargeBonusEnabled = useAppConfigStore((s) => s.rechargeBonusEnabled)

  const posClass = useMemo(() =>
    rtl
      ? 'right-1/2 ' + (hide ? 'mr-48' : 'mr-32')
      : 'left-1/2 ' + (hide ? 'ml-48' : 'ml-32'),
    [hide, rtl],
  )

  return (
    <div className={clsx('absolute duration-200 bottom-34 z-50 flex flex-col', posClass)}>
      {rechargeBonusEnabled && (
        <div className="my-2">
          <FirstRechargeButton />
        </div>
      )}
      <CustomerServiceButton className="size-14" />
      <WhatsAppButton className="size-14 mt-3" />
    </div>
  )
}
