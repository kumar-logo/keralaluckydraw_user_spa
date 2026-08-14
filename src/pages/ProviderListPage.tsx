import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ScrollShadow } from '@nextui-org/react'
import { getHomeGameList } from '../services/hallApi'
import { withLoading } from '../utils/helpers'
import { useUIStore } from '../stores/uiStore'
import { useGameStore } from '../stores/gameStore'
import { TopBar } from '../components/shared/TopBar'
import { Spin } from '../components/shared/Spin'

export const ProviderListPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const providers = useGameStore((s) => s.providers)
  const filterIcon = useGameStore((s) => s.filterIcon)
  const isDarkMode = useUIStore((s) => s.isDarkMode)
  const scale = useUIStore((s) => s.scale)

  useEffect(() => {
    withLoading(setLoading, getHomeGameList({ categoryId: 1020, pageSize: 100 }).then((data) => {
      if (data?.providers) useGameStore.getState().updateProvider(data.providers)
      if (data?.filterIcon) useGameStore.getState().updateFilterIcon({
        url: data.filterIcon,
        lightUrl: data.lightIcon ?? '',
        width: data.filterSize?.width ?? 0,
        height: data.filterSize?.height ?? 0,
      })
    }))
  }, [])

  const spriteUrl = isDarkMode ? filterIcon.url : filterIcon.lightUrl

  return (
    <div className="size-full flex flex-col">
      <TopBar title={t('provider.title')} />

      <Spin className="flex-1 flex flex-col" loading={loading}>
        <ScrollShadow className="flex-1 p-3">
          {providers.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-acc">
              <svg className="size-16 mb-4 opacity-30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6H4V4h16v2zm-2 6H6V10h12v2zm-4 6H10v-2h4v2z" />
              </svg>
              <p className="text-sm">{t('common.label.noData')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {providers.map((provider) => (
                <div
                  key={provider.filterType}
                  className="flex items-center justify-center cursor-pointer active:opacity-70"
                  onClick={() => navigate(`/gamelist/${provider.filterType}?title=${provider.filterName}`)}
                >
                  <div
                    className="bg-white dark:bg-selected rounded-sm w-32 h-14"
                    style={{
                      backgroundImage: spriteUrl ? `url(${spriteUrl})` : undefined,
                      backgroundSize: `${filterIcon.width * scale}px ${filterIcon.height * scale}px`,
                      backgroundPosition: `left -${(provider.bigIcon?.x || 0) * scale}px top -${(provider.bigIcon?.y || 0) * scale}px`,
                      boxShadow: '0 0 4px 0 rgba(0, 0, 0, 0.12)',
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </ScrollShadow>
      </Spin>
    </div>
  )
}

export default ProviderListPage
