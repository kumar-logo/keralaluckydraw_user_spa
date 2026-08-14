import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { copyToClipboard } from '../../utils/clipboard'
import { CopyIcon } from './CopyIcon'

const STATUS_STYLES = [
  { bg: 'bg-linear-tbd', color: 'text-order-waiting', label: 'common.label.toBeDrawn' },
  { bg: 'bg-linear-won', color: 'text-bg-sec', label: 'common.label.won' },
  { bg: 'bg-linear-lose', color: 'text-sec', label: 'common.label.nowin' },
]

interface OrderStatusBadgeProps {
  code?: string
  status?: number
}

export const OrderStatusBadge = ({ code = '', status = 0 }: OrderStatusBadgeProps) => {
  const { t } = useTranslation()
  const style = STATUS_STYLES[status] || STATUS_STYLES[0]

  const copyCode = (text: string) => {
    copyToClipboard(text)
  }

  return (
    <div className={clsx('p-2 flex items-center justify-between rounded-sm text-xs', style.bg)}>
      <p className={clsx('uppercase', style.color)}>
        {t(style.label)}
      </p>
      <div className="flex items-center gap-x-2">
        <p className="text-acc">ID</p>
        <p className="text-sec">{code}</p>
        <CopyIcon
          onClick={(e) => {
            e.stopPropagation()
            copyCode(code)
          }}
        />
      </div>
    </div>
  )
}
