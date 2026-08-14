import { useTranslation } from 'react-i18next'
import { Button, Image } from '@nextui-org/react'
import { TopBar } from '../components/shared/TopBar'

export const StoreAppPage = () => {
  const { t } = useTranslation()

  const handleDownload = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    if (/iphone|ipad/.test(userAgent)) {
      window.open('https://apps.apple.com', '_blank')
    } else {
      window.open('/download/app.apk', '_blank')
    }
  }

  return (
    <div className="size-full flex flex-col">
      <TopBar title={t('app.title')} />

      <div className="flex-1 p-4">

        <div className="p-6 bg-white dark:bg-gray rounded-xl mb-3 flex flex-col items-center">
          <div className="size-20 rounded-2xl overflow-hidden mb-4 shadow-sm">
            <Image
              src="/images/logos/icon-192.png"
              alt="Kerala Lucky Draw"
              classNames={{ wrapper: 'size-full', img: 'size-full object-cover' }}
            />
          </div>
          <h2 className="text-xl font-bold text-main mb-1">Kerala Lucky Draw</h2>
          <p className="text-sm text-acc text-center mb-4">{t('app.label.description')}</p>

          <Button
            className="h-12 w-full max-w-xs text-black font-bold text-base rounded-full bg-linear-primary-tb shadow-btn-primary"
            onPress={handleDownload}
          >
            {t('app.label.download')}
          </Button>
        </div>

        <div className="p-4 bg-white dark:bg-gray rounded-xl mb-3">
          <div className="text-sm font-bold text-main mb-3">{t('app.label.howToInstall')}</div>
          <div className="space-y-3 text-xs text-acc">
            <div className="flex items-start gap-2">
              <span className="size-5 rounded-full bg-primary text-black flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
              <span>{t('app.step.download')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="size-5 rounded-full bg-primary text-black flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
              <span>{t('app.step.allow')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="size-5 rounded-full bg-primary text-black flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
              <span>{t('app.step.install')}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray rounded-xl">
          <div className="text-sm font-bold text-main mb-3">{t('app.label.screenshots')}</div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="w-40 shrink-0 aspect-[9/16] rounded-xl overflow-hidden bg-selected">
                <Image
                  src={`/images/app/screenshot-${idx}.webp`}
                  alt={`Screenshot ${idx}`}
                  classNames={{ wrapper: 'w-full h-full', img: 'w-full h-full object-cover' }}
                  radius="none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoreAppPage
