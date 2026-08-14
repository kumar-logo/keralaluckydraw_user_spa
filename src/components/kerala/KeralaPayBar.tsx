import { useTranslation } from 'react-i18next'
import { Button, Image } from '@nextui-org/react'
import { formatCurrency } from '../../utils/format'

interface KeralaPayBarProps {
  quantity?: number
  isLoading?: boolean
  onConfirm?: () => void
  total?: number
  disabled?: boolean
}

export function KeralaPayBar({
  quantity = 0,
  isLoading,
  onConfirm,
  total = 0,
  disabled = false,
}: KeralaPayBarProps) {
  const { t } = useTranslation()

  return (
    <div
      style={{
        boxShadow: '0px -2px 4px 0px rgba(0, 0, 0, 0.10)',
        paddingBottom: 'calc(var(--nav-bar-height) + 0.75rem)',
      }}
      className="bg-white dark:bg-gray p-3 flex justify-between items-center z-30 relative"
    >
      <div className="flex items-center">
        <Image
          src="/images/common/shop-car.webp"
          alt="cart"
          className="h-8 w-8 rounded-none"
        />
        <div className="ml-2">
          <p className="font-bold text-main">{formatCurrency(total)}</p>
          <p className="text-xs text-acc">{quantity} BIDS</p>
        </div>
      </div>
      <Button
        isDisabled={quantity === 0 || disabled}
        isLoading={isLoading}
        className="text-black font-bold rounded-lg px-5 bg-primary bg-linear-primary-tb shadow-btn-primary"
        onPress={onConfirm}
      >
        {t('common.label.games.payNow')}
      </Button>
    </div>
  )
}
