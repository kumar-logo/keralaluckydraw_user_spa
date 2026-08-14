import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Button } from '@nextui-org/react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useAuthStore } from '../../stores/authStore'
import { useRechargeStore } from '../../stores/rechargeStore'
import { formatCurrency } from '../../utils/format'
import { fetchAndSyncBalance } from '../../utils/fetchBalance'
import { PlusIcon } from './PlusIcon'

interface BalanceDisplayProps {
  isBonus?: boolean
  hideImg?: boolean
  hideBtn?: boolean
  className?: string
}

export const BalanceDisplay = ({ isBonus, hideImg, hideBtn, className }: BalanceDisplayProps) => {
  const { t } = useTranslation()
  const balance = useAuthStore((s) => s.balance)
  const bonusBalance = useAuthStore((s) => s.bonusBalance)
  const token = useAuthStore((s) => s.token)
  const openRecharge = useRechargeStore((s) => s.openRecharge)
  const navigate = useNavigate()

  useEffect(() => {
    fetchAndSyncBalance()
  }, [])

  return token ? (
    <div
      className={clsx('flex items-center text-main p-1 pl-3 rounded-lg', className)}
      onClick={(e) => {
        openRecharge('wallet_icon')
        e.stopPropagation()
      }}
    >
      {!hideImg && (
        <Image
          src={`/images/common/${isBonus ? 'bonus' : 'wallet'}.webp`}
          alt="wallet"
          radius="none"
          classNames={{
            wrapper: 'size-6 mr-2',
            img: 'size-full',
          }}
        />
      )}
      <div className="flex flex-col">
        <span className="text-sec text-10 capitalize">
          {t('common.label.balance')}:
        </span>
        <span className="text-xs font-bold">
          {formatCurrency({ amount: isBonus ? bonusBalance : balance, hideSymbol: isBonus, abbreviate: true })}
        </span>
      </div>
      {!hideBtn && (
        <div className="ml-2 size-7 flex items-center justify-center rounded-md bg-linear-270 from-primary to-[var(--linear-primary-end)] shadow-btn-primary">
          <PlusIcon className="text-black" />
        </div>
      )}
    </div>
  ) : (
    <Button
      className="bg-linear-primary-tr shadow-btn-primary rounded-sm text-black px-2! h-8 text-xs font-bold"
      onPress={() => navigate('/register?origin=wallet_icon')}
    >
      {t('common.label.register')}
    </Button>
  )
}
