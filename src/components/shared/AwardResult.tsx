import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/format'

interface AwardResultProps {
  showMore?: boolean
  hasDetail?: boolean
  status?: number
  awardAmount?: number
}

export const AwardResult = ({
  showMore = false,
  hasDetail = false,
  status = 2,
  awardAmount = 0,
}: AwardResultProps) => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-end flex-1">
      <div className="flex flex-col items-end">
        <p className="text-xs">
          {t(
            status === 1
              ? 'common.label.won'
              : status === 2
                ? 'common.label.toBeDrawn'
                : 'common.label.nowin'
          )}
        </p>
        {status !== 2 ? (
          <p
            className={`font-bold din text-sm ${
              status === 1 && awardAmount > 0 ? 'text-order-finish' : 'text-main'
            }`}
          >
            {formatCurrency(awardAmount)}
          </p>
        ) : (
          <p>...</p>
        )}
      </div>
      {hasDetail && (
        <div
          className="w-3.5 h-3.5 ml-2"
          style={{
            transition: '0.2s',
            transform: showMore ? '' : 'rotate(-90deg)',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M3.5 5.25L7 8.75L10.5 5.25"
              stroke="var(--bg-icon-gray)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  )
}
