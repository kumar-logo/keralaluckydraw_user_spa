import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@nextui-org/react'

export const Checken3Page = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div
      className="flex flex-col min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/images/land/checken3-bg.webp)' }}
    >
      <div className="flex-1 flex flex-col items-center justify-end pb-32 px-6">
        <h1 className="text-3xl font-black text-white mb-2 text-center drop-shadow-lg">
          Kerala Lucky Draw
        </h1>
        <p className="text-sm text-white/80 text-center mb-8 max-w-sm">
          {t('land.checken3.desc')}
        </p>

        <Button
          className="h-13 w-full max-w-xs text-black font-bold text-base rounded-full bg-linear-primary-tb shadow-btn-primary mb-3"
          onPress={() => navigate('/index')}
        >
          {t('land.label.playNow')}
        </Button>

        <Button
          className="h-10 w-full max-w-xs text-white font-bold bg-white/20 rounded-full backdrop-blur-sm"
          onPress={() => navigate('/store/apps/details')}
        >
          {t('land.label.downloadApp')}
        </Button>
      </div>
    </div>
  )
}

export default Checken3Page
