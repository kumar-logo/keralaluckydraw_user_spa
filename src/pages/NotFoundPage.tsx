import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Image } from '@nextui-org/react'

export const NotFoundPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="size-full flex flex-col items-center justify-center px-6">
      <Image
        src="/images/common/404.webp"
        alt="404"
        classNames={{ wrapper: 'w-48 h-48 mb-6', img: 'w-full h-full object-contain' }}
      />

      <h2 className="text-xl font-bold text-main mb-2">
        {t('error.title')}
      </h2>

      <p className="text-sm text-acc text-center mb-8">
        {t('error.subtitle')}
      </p>

      <Button
        className="h-12 w-full max-w-xs text-black font-bold text-base rounded-full bg-linear-primary-tb shadow-btn-primary"
        onPress={() => navigate('/index', { replace: true })}
      >
        {t('common.label.backHome')}
      </Button>
    </div>
  )
}

export default NotFoundPage
