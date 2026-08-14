import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@nextui-org/react'
import { useAuthStore } from '../stores/authStore'
import { openCS } from '../components/shared/salesSmartly'

export const BannedPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const userInfo = useAuthStore((s) => s.userInfo)
  const removeToken = useAuthStore((s) => s.removeToken)
  const reason = userInfo?.banReason?.trim()

  const handleLogout = () => {
    removeToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="size-full min-h-dvh flex flex-col bg-white dark:bg-charcoal">
      <div className="relative bg-linear-primary-tr pt-14 pb-16 px-6 rounded-b-[2rem] overflow-hidden">
        <div className="absolute -right-8 -top-8 size-40 rounded-full bg-white/15" />
        <div className="absolute right-16 top-20 size-16 rounded-full bg-white/10" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="size-20 rounded-full bg-white/25 backdrop-blur flex items-center justify-center mb-4">
            <svg className="size-11 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M5.64 5.64l12.72 12.72" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-black">
            {t('ban.title', 'Account Suspended')}
          </h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 -mt-8">
        <div className="w-full max-w-sm bg-white dark:bg-gray rounded-2xl shadow-lg p-5 text-center">
          <p className="text-sm text-main font-bold mb-2">
            {t('ban.heading', 'Your account access has been restricted')}
          </p>
          <p className="text-sm text-acc leading-relaxed">
            {reason ||
              t(
                'ban.desc',
                'Your account has been suspended. Please contact customer support for more information.',
              )}
          </p>
          {userInfo?.phone ? (
            <div className="mt-4 pt-4 border-t border-gray/60 text-xs text-acc">
              {t('ban.account', 'Account')}: {userInfo.phone}
            </div>
          ) : null}
        </div>

        <div className="w-full max-w-sm flex flex-col gap-3 mt-8">
          <Button
            className="h-12 rounded-full bg-linear-primary-tr text-black font-bold shadow-btn-primary"
            onPress={() => openCS()}
          >
            {t('ban.contactSupport', 'Contact Support')}
          </Button>
          <Button
            variant="light"
            className="h-11 rounded-full text-acc font-bold"
            onPress={handleLogout}
          >
            {t('common.label.logout', 'Log Out')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BannedPage
