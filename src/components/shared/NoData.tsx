import { useTranslation } from 'react-i18next'
import { Image } from '@nextui-org/react'

interface NoDataProps {
  text?: string
}

export const NoData = ({ text }: NoDataProps) => {
  const { t } = useTranslation()
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <Image
        className="w-40 h-40 z-0"
        disableSkeleton
        alt="404 not found"
        src="/images/common/no-data.webp"
      />
      <p className="mt-5 text-sm text-sec">
        {text || t('errorPage.label.noData')}
      </p>
    </div>
  )
}
