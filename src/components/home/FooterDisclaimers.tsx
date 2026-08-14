import { useTranslation } from 'react-i18next'
import { useAppConfigStore } from '../../stores/configStore'

const StarIcon = ({ className, fill }: { className?: string; fill?: boolean }) => (
  <svg className={'size-5 ' + (className || '')} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      className="duration-200"
      d="M9.81934 5.4707C9.90367 5.3394 10.0963 5.3394 10.1807 5.4707L11.3242 7.25098C11.5273 7.56721 11.8416 7.79613 12.2051 7.8916L14.252 8.42871C14.4027 8.46831 14.4627 8.65069 14.3643 8.77148L13.0234 10.4102C12.7856 10.7009 12.666 11.0703 12.6875 11.4453L12.8086 13.5586C12.8175 13.7144 12.662 13.8272 12.5166 13.7705L10.5449 13.002C10.1947 12.8655 9.8053 12.8655 9.45508 13.002L7.4834 13.7705C7.33799 13.8272 7.18246 13.7144 7.19141 13.5586L7.3125 11.4453C7.33396 11.0703 7.21435 10.7009 6.97656 10.4102L5.63574 8.77148C5.53734 8.6507 5.59726 8.46831 5.74805 8.42871L7.79492 7.8916C8.15844 7.79613 8.47266 7.56721 8.67578 7.25098L9.81934 5.4707Z"
      stroke="currentColor"
      strokeWidth="1.28571"
      fill={fill ? 'currentColor' : '#0000'}
    />
  </svg>
)

export const FooterDisclaimers = () => {
  const { t } = useTranslation()
  const appName = useAppConfigStore((s) => s.appName) || 'Kerala Lucky Draw'

  return (
    <div className="w-full dark:bg-gray p-2 mb-16 text-xs *:mb-2">
      <div className="flex">
        <StarIcon className="size-4 shrink-0 mt-0.5 mr-1 text-primary" />
        {t('home.tip.foot1')}
      </div>
      <div className="flex">
        <StarIcon className="size-4 shrink-0 mt-0.5 mr-1 text-primary" />
        {t('home.tip.foot2')}
      </div>
      <div className="flex">
        <StarIcon className="size-4 shrink-0 mt-0.5 mr-1 text-primary" />
        {t('home.tip.foot3')}
      </div>
      <div className="flex text-danger">
        <StarIcon className="size-4 shrink-0 mt-0.5 mr-1 text-danger" />
        {t('home.tip.foot4')}
      </div>
      <div className="flex text-danger">
        <StarIcon className="size-4 shrink-0 mt-0.5 mr-1 text-danger" />
        {t('home.tip.foot5', { appName })}
      </div>
    </div>
  )
}
