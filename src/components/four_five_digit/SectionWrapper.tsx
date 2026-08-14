import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/format'

interface SectionWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  price: number
  prizeRender: React.ReactNode
  title: string
  children: React.ReactNode
  className?: string
}

export const SectionWrapper = ({
  price,
  prizeRender,
  title,
  children,
  className,
  ...rest
}: SectionWrapperProps) => {
  const { t } = useTranslation()

  return (
    <div
      className={clsx(
        'p-2 brand-sec-wash bg-white dark:bg-gray rounded-sm flex flex-col',
        className
      )}
      {...rest}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <p className="text-sm text-main font-bold">
            {t(`common.label.games.${title}`)} {t('common.label.digit')}
          </p>
          <p className="text-xs font-bold ml-1">
            {formatCurrency(price)}
            <span className="font-medium">/{t('common.label.ticket')}</span>
          </p>
        </div>
        {prizeRender}
      </div>
      {children}
    </div>
  )
}
