import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../../utils/date'
import { ResultGameCover } from './ResultGameCover'
import { DubaiHistory } from '../dubai/DubaiHistory'
import { DubaiAssetContext, DUBAI_DEFAULT_THEME_COLOR } from '../dubai/DubaiIcons'
import { getDubaiGameInfo } from '../../services/dubaiApi'

interface P1bGameInfo {
  drawTimeSec: number
  themeColor?: string | null
  assetIcons?: Record<string, string>
}

const DUBAI_GAME_ID = 1102

export const DubaiResult = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [updateCode, setUpdateCode] = useState(0)
  const [info, setInfo] = useState<P1bGameInfo>()

  const refresh = () =>
    getDubaiGameInfo(DUBAI_GAME_ID).then((data) => {
      setInfo(data as unknown as P1bGameInfo)
      setUpdateCode((code) => code + 1)
    })

  return (
    <DubaiAssetContext.Provider value={info?.assetIcons ?? {}}>
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ '--dubai-theme-color': info?.themeColor || DUBAI_DEFAULT_THEME_COLOR } as React.CSSProperties}
    >
      <ResultGameCover
        icon="/images/dubai/icon.webp"
        onTimeEnd={refresh}
        countDown={info ? info.drawTimeSec - Math.floor(Date.now() / 1000) : 0}
        gameType="dubai"
        title={
          <span className="font-bold text-white flex flex-col">
            <span>{t('result.dubai.title')}</span>
            <span className="text-xs">Official</span>
          </span>
        }
        onPlay={() => navigate(`/games/dubai?id=${DUBAI_GAME_ID}&code=P1O`)}
        subheading={t('common.label.games.nextDraw')}
        nextDraw={info ? formatDate(info.drawTimeSec * 1000, 'Mon ddsuffix hh:mm') : '--'}
      />
      <div className="flex-1 overflow-hidden">
        <DubaiHistory dropClassName="z-50" gameType={0} gameID={DUBAI_GAME_ID} updateCode={updateCode} />
      </div>
      <div className="bg-gray w-full h-(--nav-bar-height) shrink-0" />
    </div>
    </DubaiAssetContext.Provider>
  )
}
