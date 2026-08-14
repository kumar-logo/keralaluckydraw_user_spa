import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Image } from '@nextui-org/react'
import { formatDate } from '../../utils/date'
import { withLoading, resolveAssetUrl } from '../../utils/helpers'
import { Spin } from '../shared/Spin'
import { DigitBadge } from '../shared/DigitBadge'
import { ChevronIcon } from '../shared/ChevronIcon'
import { getKeralaOfficialLatestDraw, KeralaLatestDraw } from '../../services/keralaApi'

interface KeralaResultItem {
  gameID?: number
  gameName?: string
  icon?: string
  result1st?: string
  roundNo?: string | number
  drawTime?: string | number
  gameType?: string
}

interface KeralaResultProps {
  gameCode: string
}

export const KeralaResult = ({ gameCode }: KeralaResultProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<KeralaResultItem[]>([])

  const toResultItem = (draw: KeralaLatestDraw, gameType: string): KeralaResultItem => ({
    gameID: draw.gameId,
    gameName: t('common.label.games.kerala'),
    icon: draw.icon,
    result1st: draw.drawResult || draw.prizes?.first || '',
    roundNo: draw.roundNo,
    drawTime: draw.drawTime,
    gameType,
  })

  const fetchList = async (): Promise<KeralaResultItem[]> => {
    if (gameCode !== 'kerala') return []
    const [official] = await Promise.allSettled([getKeralaOfficialLatestDraw()])
    const officialList: KeralaLatestDraw[] = official.status === 'fulfilled' && Array.isArray(official.value) ? official.value : []
    return officialList.map((draw) => toResultItem(draw, ''))
  }

  useEffect(() => {
    withLoading(setLoading, fetchList().then((items) => setList(items)))
  }, [gameCode])

  const goDetail = (item: KeralaResultItem) => {
    localStorage.setItem('ResultDetails', JSON.stringify(item))
    navigate(
      `/result/lottery/detail?gameName=${item.gameName}&gameCode=${gameCode}&gameID=${item.gameID}&roundNo=${item.roundNo}&drawTime=${item.drawTime}&gameType=${item.gameType || ''}`
    )
  }

  return (
    <Spin loading={loading} className="overflow-y-auto flex-1 flex flex-col pb-16">
      <div className="flex flex-col p-2 gap-y-2">
        {!loading && list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-acc">
            <svg className="size-16 mb-4 opacity-30" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 6H4V4h16v2zm-2 6H6V10h12v2zm-4 6H10v-2h4v2z" />
            </svg>
            <p className="text-sm">{t('common.label.noData')}</p>
          </div>
        ) : null}
        {list.map((item, idx) => (
          <Button
            key={idx}
            onPress={() => goDetail(item)}
            className="flex items-center min-w-0 h-auto gap-0 p-3 rounded-sm bg-selected"
          >
            <div className="flex flex-col items-start">
              {item.icon ? (
                <div className={gameCode === 'kerala' ? 'h-10' : 'h-16'}>
                  <Image alt="" src={resolveAssetUrl(item.icon)} classNames={{ wrapper: 'h-full', img: 'h-full rounded-none' }} />
                </div>
              ) : null}
              <p className="font-bold text-sm text-main mt-1">{item.gameName}</p>
            </div>
            <div className="flex flex-1 flex-row items-center gap-x-2">
              <div className="flex flex-1 flex-col items-end gap-y-1">
                <p className="text-sm font-bold">{item.roundNo}</p>
                <p className="text-xs font-bold text-main">{formatDate(item.drawTime ?? 0, 'dd-MM-yyyy hh:mm')}</p>
                <div className="flex items-center gap-x-0.5">
                  {item.result1st
                    ? item.result1st
                        .split('')
                        .map((digit, p) => (
                          <DigitBadge key={p} digit={digit} size="1.25rem" outline={gameCode !== 'kerala' || p !== 0} />
                        ))
                    : '--'}
                </div>
              </div>
              <ChevronIcon />
            </div>
          </Button>
        ))}
      </div>
    </Spin>
  )
}
