import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ScrollShadow, Button } from '@nextui-org/react'
import { searchGameList } from '../services/hallApi'
import { withLoading } from '../utils/helpers'
import { TopBar } from '../components/shared/TopBar'
import { Spin } from '../components/shared/Spin'
import { GameImage } from '../components/shared/GameImage'
import { CollectWrapper } from '../components/shared/CollectWrapper'

interface SearchGameResult {
  id?: number | string
  gameID?: number | string
  path?: string
  gameUrl?: string
  verticalPic?: string
  gamePic?: string
  icon?: string
  image?: string
  imgId?: string
  name?: string
}

interface SearchGameListData {
  list?: SearchGameResult[]
  content?: SearchGameResult[]
}

const RECENT_KEY = 'lucky3d_recent_searches'
const MAX_RECENT = 10

const getRecent = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch { return [] }
}

const addRecent = (keyword: string) => {
  const list = getRecent().filter((s) => s !== keyword)
  list.unshift(keyword)
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)))
}

export const SearchGamesPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<SearchGameResult[]>([])
  const [recent, setRecent] = useState<string[]>(getRecent())
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSearch = (kw?: string) => {
    const query = (kw || keyword).trim()
    if (!query) return
    addRecent(query)
    setRecent(getRecent())
    setSearched(true)
    withLoading(setLoading, searchGameList({ keyword: query }).then((raw) => {
      const data = raw as SearchGameListData | SearchGameResult[] | null
      if (Array.isArray(data)) {
        setResults(data)
      } else {
        setResults(data?.list || data?.content || [])
      }
    }))
  }

  const handleGameClick = (game: SearchGameResult) => {
    if (game.path) navigate(game.path)
    else if (game.gameUrl) window.open(game.gameUrl, '_blank')
  }

  const clearRecent = () => {
    localStorage.removeItem(RECENT_KEY)
    setRecent([])
  }

  return (
    <div className="size-full flex flex-col">
      <TopBar
        title={
          <div className="flex items-center gap-2 w-full">
            <input
              ref={inputRef}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              className="flex-1 h-8 px-3 text-sm bg-selected rounded-full text-main outline-none placeholder:text-acc"
              placeholder={t('search.ph.keyword')}
            />
            <Button
              size="sm"
              className="h-8 px-3 bg-primary text-black font-bold rounded-full text-xs"
              onPress={() => handleSearch()}
            >
              {t('common.label.search')}
            </Button>
          </div>
        }
        titleAlignLeft
      />

      <Spin className="flex-1 flex flex-col" loading={loading}>
        <ScrollShadow className="flex-1 p-3">

          {!searched && recent.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-main">{t('search.label.recent')}</span>
                <Button
                  size="sm"
                  className="h-6 text-[10px] text-acc bg-transparent"
                  onPress={clearRecent}
                >
                  {t('common.label.clear')}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((kw, idx) => (
                  <Button
                    key={idx}
                    size="sm"
                    className="h-7 text-xs text-main bg-white dark:bg-gray rounded-full px-3"
                    onPress={() => { setKeyword(kw); handleSearch(kw) }}
                  >
                    {kw}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {searched && results.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-acc">
              <svg className="size-16 mb-4 opacity-30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6H4V4h16v2zm-2 6H6V10h12v2zm-4 6H10v-2h4v2z" />
              </svg>
              <p className="text-sm">{t('common.label.noData')}</p>
            </div>
          ) : searched ? (
            <div className="grid grid-cols-3 gap-2">
              {results.map((game, idx) => (
                <CollectWrapper
                  key={game.id || game.gameID || idx}
                  game={game}
                  className="cursor-pointer"
                  onClick={() => handleGameClick(game)}
                >
                  <div className="relative w-full h-37 rounded-sm overflow-hidden bg-selected">
                    <GameImage
                      src={game.verticalPic || game.gamePic || game.icon || game.image}
                      imgId={game.imgId}
                      variant="casino"
                      alt={game.name}
                      classNames={{ wrapper: 'w-full h-full', img: 'w-full h-full object-cover' }}
                      radius="none"
                    />
                  </div>
                </CollectWrapper>
              ))}
            </div>
          ) : null}
        </ScrollShadow>
      </Spin>
    </div>
  )
}

export default SearchGamesPage
