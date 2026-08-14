import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCasinoGameUrl } from '../services/hallApi'
import { TopBar } from '../components/shared/TopBar'
import { Spin } from '../components/shared/Spin'

export const PartnerPage = () => {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const title = params.get('title') || t('common.label.games.label')
  const gameCode = params.get('gameCode') || ''
  const [gameUrl, setGameUrl] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(!!gameCode)

  useEffect(() => {
    if (!gameCode) return
    setLoading(true)
    getCasinoGameUrl(gameCode)
      .then((data: { url?: string; message?: string } | null) => {
        setGameUrl(data?.url || '')
        setMessage(data?.url ? '' : data?.message || '')
      })
      .catch(() => setGameUrl(''))
      .finally(() => setLoading(false))
  }, [gameCode])

  return (
    <div className="size-full flex flex-col">
      <TopBar title={title} />

      <Spin loading={loading} className="flex-1 flex flex-col">
        {/^https?:\/\//.test(gameUrl) ? (
          <iframe
            src={gameUrl}
            title={title}
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

export default PartnerPage
