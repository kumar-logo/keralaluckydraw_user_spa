import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCasinoGameUrl } from '../services/hallApi'
import { useAuthStore } from '../stores/authStore'
import { useAppConfigStore } from '../stores/configStore'
import { Spin } from '../components/shared/Spin'

export const SportsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const sportsGameCode = useAppConfigStore((s) => s.sportsGameCode)

  const [gameUrl, setGameUrl] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    if (!sportsGameCode) {
      setLoading(false)
      setMessage(t('sports.label.unavailable', 'Sports betting is not available right now.'))
      return
    }
    setLoading(true)
    getCasinoGameUrl(sportsGameCode)
      .then((data: { url?: string; message?: string } | null) => {
        setGameUrl(data?.url || '')
        setMessage(data?.url ? '' : data?.message || '')
      })
      .catch(() => setGameUrl(''))
      .finally(() => setLoading(false))
  }, [token, sportsGameCode, navigate, t])

  return (
    <div className="size-full flex flex-col bg-light-gray dark:bg-charcoal">
      <Spin loading={loading} className="flex-1 flex flex-col">
        {/^https?:\/\//.test(gameUrl) ? (
          <iframe
            src={gameUrl}
            title={t('sports.label.title', 'Sports')}
            className="flex-1 w-full border-0"
            allow="fullscreen; autoplay; clipboard-write"
          />
        ) : (
          !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-acc p-6 text-center">
              <p className="text-sm">{message || t('common.label.noData')}</p>
            </div>
          )
        )}
      </Spin>
    </div>
  )
}

export default SportsPage
