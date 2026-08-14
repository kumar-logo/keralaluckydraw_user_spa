import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ScrollShadow } from '@nextui-org/react'
import { getHomeGameList, HomeGame, HomeGameListResponse } from '../services/hallApi'
import { withLoading, checkAuth } from '../utils/helpers'
import { TopBar } from '../components/shared/TopBar'
import { Spin } from '../components/shared/Spin'
import { GameImage } from '../components/shared/GameImage'
import { CollectWrapper } from '../components/shared/CollectWrapper'

interface GameListItem extends HomeGame {
  path?: string
  tag?: string
}

type GameListData = HomeGameListResponse & {
  games?: GameListItem[]
  content?: GameListItem[]
}

export const GameListPage = () => {
  const { type = '' } = useParams<{ type: string }>()
  const [searchParams] = useSearchParams()
  const title = searchParams.get('title') || type
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [games, setGames] = useState<GameListItem[]>([])

  useEffect(() => {
    withLoading(setLoading, getHomeGameList({ filterType: type, pageSize: 50 }).then((raw) => {
      const data = raw as GameListData
      const list = data?.list || []
      const allGames = list.flatMap((section) => (section.games || []) as GameListItem[])
      setGames(allGames.length > 0 ? allGames : data?.games || data?.content || [])
    }))
  }, [type])

  const handleGameClick = (game: GameListItem) => {
    if (game.provider !== 'TK') {
      if (!checkAuth()) return
      navigate(`/partner-page/casino?url=${encodeURIComponent(game.gameUrl || '')}&gameCode=${encodeURIComponent(game.gameCode || '')}&title=${encodeURIComponent(game.gameName || '')}`)
    } else if (game.path) {
      navigate(game.path)
    }
  }

  return (
    <div className="size-full flex flex-col">
      <TopBar title={title} />

      <Spin className="flex-1 flex flex-col" loading={loading}>
        <ScrollShadow className="flex-1 p-3">
          {games.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-acc">
              <GameImage src="/images/common/no-data.webp" alt="no data" classNames={{ wrapper: 'size-16 mb-4 opacity-30' }} />
              <p className="text-sm">{t('common.label.noData')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {games.map((game, idx) => (
                <CollectWrapper
                  key={game.gameId || game.gameCode || idx}
                  game={game}
                  className="cursor-pointer"
                  onClick={() => handleGameClick(game)}
                >
                  <div className="relative w-full h-37 rounded-sm overflow-hidden bg-selected">
                    <GameImage
                      src={game.verticalPic || game.gamePic || game.icon}
                      imgId={game.imgId}
                      variant="casino"
                      alt={game.gameName || game.name}
                      classNames={{ wrapper: 'w-full h-full', img: 'w-full h-full object-cover' }}
                      radius="none"
                    />
                    {game.tag && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-bold bg-primary text-black rounded-sm">
                        {game.tag}
                      </span>
                    )}
                  </div>
                </CollectWrapper>
              ))}
            </div>
          )}
        </ScrollShadow>
      </Spin>
    </div>
  )
}

export default GameListPage
