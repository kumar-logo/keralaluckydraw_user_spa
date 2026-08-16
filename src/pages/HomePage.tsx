import { useState, useEffect, useRef, useCallback, useMemo, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Image, Button } from '@nextui-org/react'
import Slider from 'react-slick'
import clsx from 'clsx'
import { getMysteryBoxGameList, MysteryBox, MysteryBoxGroup } from '../services/mysteryBoxApi'
import {
  getBannerList,
  getHomeGameList,
  HomeBanner,
  HomeGame,
  HomeSection,
  HomeGameListResponse,
} from '../services/hallApi'
import { getLuckySpinInfo, LuckySpinInfoDto } from '../services/luckySpinApi'
import { useUIStore } from '../stores/uiStore'
import { useAppConfigStore } from '../stores/configStore'
import { withLoading, resolveAssetUrl } from '../utils/helpers'
import { formatCurrency } from '../utils/format'
import { fetchAndSyncBalance } from '../utils/fetchBalance'
import { Spin } from '../components/shared/Spin'
import { Banner } from '../components/shared/Banner'
import { GameImage } from '../components/shared/GameImage'
import { HomeSpriteIcon } from '../components/shared/SpriteIcon'
import { HomeHeader } from '../components/home/HomeHeader'
import { DownloadBanner } from '../components/home/DownloadBanner'
import { CheckInCashReward } from '../components/home/CheckInCashReward'
import { OfficialChannels } from '../components/home/OfficialChannels'
import { FooterDisclaimers } from '../components/home/FooterDisclaimers'
import { FloatingActions } from '../components/home/FloatingActions'
import { useInsuranceRulesModal } from '../hooks/useInsuranceRulesModal'

const groupByPrice = (boxes: MysteryBox[]): MysteryBoxGroup[] =>
  boxes.reduce<MysteryBoxGroup[]>((groups, box) => {
    let group = groups.find((g) => g.price === box.price)
    if (!group) {
      group = {
        ...box,
        topPrize: box.items?.[0]?.prize ?? 0,
        totalFreeCount: 0,
        items: [],
      }
      groups.push(group)
    }
    group.totalFreeCount += box.freeCount
    group.items.push(box)
    return groups
  }, [])

const mysteryBoxGradients = [
  'linear-gradient(180deg, #FFB889 0%, #C34F02 100%)',
  'linear-gradient(180deg, #C4DBFF 0%, #5386D8 100%)',
  'linear-gradient(180deg, #E5BFF1 0%, #A356BB 100%)',
  'linear-gradient(180deg, #BFE7A7 0%, #599A31 100%)',
  'linear-gradient(180deg, #F6DB9B 0%, #CAA03C 100%)',
  'linear-gradient(180deg, #FBCFB4 0%, #C26930 100%)',
  'linear-gradient(180deg, #E9EDB6 0%, #9EA810 100%)',
  'linear-gradient(180deg, #F9C0C0 0%, #C13B3B 100%)',
]

const GAME_CATEGORY = {
  lottery: 1,
  casino: 5,
  slot: 6,
  lobby: 1020,
  live: 1025,
  fishing: 1026,
} as const

type HomeGameItem = HomeGame

const fetchHomeGameList = ({ categoryId, filterType, pageSize = 12, pageNum = 1 }: {
  categoryId?: number
  filterType?: string
  pageSize?: number
  pageNum?: number
}): Promise<HomeGameListResponse> =>
  getHomeGameList({ categoryId, filterType, pageSize, pageNum }).then((data) => {
    if (data?.group) {
      localStorage.setItem('tg_link', data.group.tg_link || '')
      localStorage.setItem('wa_link', data.group.wa_link || '')
      localStorage.setItem('x_link', data.group.x_link || '')
      localStorage.setItem('facebook_link', data.group.facebook_link || '')
      localStorage.setItem('instagram_link', data.group.instagram_link || '')
    }
    if (data?.home) {
      const bonusRain = data.home.find((entry) => entry.gameName === 'Bonus Rain')
      const nowSec = Math.round(Date.now() / 1e3)
      const startTime = bonusRain?.startTime
      if (
        bonusRain &&
        (bonusRain.drawTime > nowSec ||
          (startTime !== undefined && startTime > nowSec))
      ) {
        const isRunning = startTime !== undefined && startTime < nowSec
        sessionStorage.setItem('cashRewardRunning', isRunning ? 'true' : '')
        window.dispatchEvent(new CustomEvent('triggerCashRewardRender', {
          detail: { cashRewardRunning: isRunning, startTime },
        }))
      } else {
        sessionStorage.setItem('cashRewardRunning', '')
        window.dispatchEvent(new CustomEvent('triggerCashRewardRender', {
          detail: { cashRewardRunning: false },
        }))
      }
    }
    return data
  })

const buildGamePath = (game: HomeGame, isBonus?: boolean) => {
  let path = ''
  switch (game.gameType) {
    case 'K3':
      path = '/games/k3?id=' + game.gameId; break
    case '3Digits':
      path = `/games/digit?id=${game.gameId}&pickName=${game.gameName}&cycle=${game.cycle}&pickGameType=${game.isQuick ? 'quick' : 'normal'}`; break
    case 'WinGo':
      path = '/games/wingo?id=' + game.gameId; break
    case 'Run & Guess':
      path = '/games/race?id=' + game.gameId; break
    case 'Kerala':
      path = `/games/kerala?id=${game.gameId}&code=${game.gameCode}`; break
    case 'Dubai Lottery':
      path = `/games/dubai?id=${game.gameId}&code=${game.gameCode}`; break
    case 'Digit 4 & 5':
      path = `/games/5d?id=${game.gameId}&price=${game.sellingPrice}`; break
  }
  if (path && isBonus) path += '&isBonus=true'
  return path
}

const handleSkipUrl = (url: string) => {
  if (url.startsWith('http')) window.open(url, '_blank')
  else if (url.startsWith('route:')) {
    window.dispatchEvent(new CustomEvent('gotourl', { detail: { url: url.substring(6), type: 'push' } }))
  } else if (url.startsWith('action:')) {
    const params = new URLSearchParams(url.substring(7))
    const type = params.get('type')
    if (type === 'recharge') window.dispatchEvent(new CustomEvent('openRechargeDraw'))
  } else {
    window.dispatchEvent(new CustomEvent('gotourl', { detail: { url, type: 'push' } }))
  }
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={clsx('animate-pulse rounded bg-gray/30', className)} />
)

const ChevronArrow = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={clsx('size-3 text-svg-gray', className)}
    viewBox="0 0 12 12"
    fill="none"
  >
    <path
      d="M2.77778 5L5.88889 8.11111L9 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg className={clsx('size-4', className)} viewBox="0 0 16 16" fill="none">
    <path
      d="M2.5132 5.50118H6.55302V1.5H9.57686V5.50117H13.5517L8.03246 11.4529L2.5132 5.50118ZM13.5475 11.4881V12.4641H2.53195V11.4881H1.5V14.464H2.53195H13.5475H14.5074V11.4881H13.5475Z"
      fill="currentColor"
    />
  </svg>
)

const triggerDownload = () => {
  window.dispatchEvent(new CustomEvent('triggerDownload'))
}

const TimerDigit = ({ value }: { value: string }) => (
  <div className="text-white relative rounded-xs">
    <div className="w-full h-full flex items-center justify-center">{value}</div>
  </div>
)

const FlipUnit = ({ value }: { value: string }) => (
  <div
    className="din font-bold text-white text-11 leading-3 rounded-sm px-1 py-1 min-w-6 text-center"
    style={{ background: '#1c1c1c' }}
  >
    {value}
  </div>
)

const CountdownTimer = ({ resetTime = 0, remain = 0, currentTime = 0, showDay, hiddenSecWhenShowDay, flip }: {
  resetTime?: number
  remain?: number
  currentTime?: number
  showDay?: boolean
  hiddenSecWhenShowDay?: boolean
  flip?: boolean
}) => {
  const ref = useRef<number | undefined>(undefined)
  const [left, setLeft] = useState(0)

  const parts = useMemo(() => {
    const days = Math.floor(left / 86400)
    const hours = Math.floor(left / 3600) % (showDay ? 24 : Infinity)
    const minutes = Math.floor(left / 60) % 60
    const seconds = left % 60
    return {
      days: String(days).padStart(2, '0'),
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
    }
  }, [left, showDay])

  useEffect(() => {
    if (remain) {
      if (ref.current === undefined) ref.current = remain
      ref.current = ref.current - 1
      if (ref.current <= 0) ref.current = resetTime
      setLeft(ref.current)
    }
  }, [currentTime])

  if (flip) {
    const units: string[] = []
    if (showDay && parts.days !== '00') units.push(parts.days)
    units.push(parts.hours)
    units.push(parts.minutes)
    if (!hiddenSecWhenShowDay || !showDay || parts.days === '00') units.push(parts.seconds)
    return (
      <div className="flex items-center gap-1">
        {units.map((val, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="text-white font-black text-11 leading-4">:</span>}
            <FlipUnit value={val} />
          </Fragment>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-end text-xs px-2 py-1 space-x-0.25 din font-bold leading-4 bg-black/40 rounded *:[span]:text-white/50 *:[span]:font-medium *:[span]:not-last:mr-1">
      {showDay && parts.days !== '00' && (
        <><TimerDigit value={parts.days} /><span>d</span></>
      )}
      <TimerDigit value={parts.hours} /><span>h</span>
      <TimerDigit value={parts.minutes} /><span>m</span>
      {(!hiddenSecWhenShowDay || !showDay || parts.days === '00') && (
        <><TimerDigit value={parts.seconds} /><span>s</span></>
      )}
    </div>
  )
}

const ClosedWrapper = ({ children, closed, emergencyStop = false, drawInProgress = false, className, onPress, gameName, style, ...rest }: {
  children: React.ReactNode
  closed: boolean
  emergencyStop?: boolean
  drawInProgress?: boolean
  className?: string
  onPress?: () => void
  gameName?: string
  style?: React.CSSProperties
}) => {
  const { t } = useTranslation()
  return (
    <Button
      className={clsx('relative overflow-hidden p-0 h-auto gap-0', !closed && !emergencyStop && 'opacity-100 duration-100 active:opacity-80', className)}
      style={style}
      {...rest}
      onPress={() => {
        if (emergencyStop) {
          import('../utils/toast').then(({ toast }) => toast.show({ icon: 'warning', message: t('common.tip.gameStopped') }))
        } else if (closed && !drawInProgress) {
          import('../utils/toast').then(({ toast }) => toast.show({ icon: 'warning', message: t('common.tip.warn.gameClosed', { gameName }) }))
        } else {
          onPress?.()
        }
      }}
    >
      {children}
      {emergencyStop ? (
        <div className="absolute left-0 top-0 size-full bg-black/60 z-20 flex items-center justify-center">
          <span className="px-3 py-1 rounded-full bg-danger text-white text-xs font-bold uppercase">
            {t('common.label.games.stopped')}
          </span>
        </div>
      ) : drawInProgress ? (
        <div className="absolute left-0 top-0 size-full bg-white/50 z-10 flex items-center justify-center">
          <span className="px-3 py-1 rounded-full bg-charcoal text-white text-xs font-bold uppercase">
            {t('common.label.inProgress')}
          </span>
        </div>
      ) : closed && (
        <div className="absolute left-0 top-0 size-full bg-white/50 z-10">
          <img src="/images/common/closed.webp" alt="closed" className="size-11 absolute! right-0 top-0 rounded-none" />
        </div>
      )}
    </Button>
  )
}

const useTickTimer = () => {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const tickRef = useRef(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    tickRef.current = Date.now()
    setCurrentTime(tickRef.current)
    intervalRef.current = setInterval(() => {
      tickRef.current += 1000
      setCurrentTime(tickRef.current)
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  return currentTime
}

const DubaiCard = ({ item, currentTime }: { item: HomeGameItem; currentTime: number }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const remain = useMemo(() => item.countDown, [item])
  const emergencyStop = item.emergencyStop === 1

  const goDubai = () => {
    if (emergencyStop) {
      import('../utils/toast').then(({ toast }) => toast.show({ icon: 'warning', message: t('common.tip.gameStopped') }))
      return
    }
    navigate(`/games/dubai?id=${item.gameId}&code=${item.gameCode}`)
  }

  return (
    <div
      onClick={goDubai}
      className="rounded col-span-1 h-25 relative overflow-hidden shadow-sm"
    >
      <GameImage src={item.gamePic} imgId={item.imgId} variant="original256" className="z-0 absolute left-0 top-0 size-full" removeWrapper radius="none" />
      {emergencyStop && (
        <div className="absolute left-0 top-0 size-full bg-black/60 z-20 flex items-center justify-center">
          <span className="px-3 py-1 rounded-full bg-danger text-white text-xs font-bold uppercase">
            {t('common.label.games.stopped')}
          </span>
        </div>
      )}
      <div className="h-25 p-2 flex flex-col justify-end relative z-10">
        <p className="text-sm font-bold text-white">{item.gameName}</p>
        <div className="flex-1" />
        <div className="h-7.5 w-full rounded-sm flex items-center justify-between mb-1">
          <p className="text-10 text-white font-bold">{item.gameCode === 'P1Q' ? '30S Draw' : 'Hourly Draw'}</p>
          <CountdownTimer remain={remain} currentTime={currentTime} resetTime={item.gameCode === 'P1Q' ? 30 : 3600} />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-white font-bold text-xs">
            {formatCurrency(item.sellingPrice, 0)}/
            <span className="text-8 font-medium text-white/60">{t('common.label.ticket')}</span>
          </p>
          <Button
            className="h-5 px-3 rounded-full bg-white text-xs font-bold text-black"
            onPress={goDubai}
          >
            {t('common.label.playNow')}
          </Button>
        </div>
      </div>
    </div>
  )
}

const DubaiSection = ({ games }: { games: HomeGame[] }) => {
  const currentTime = useTickTimer()
  const groups = useMemo(() => {
    const byGroup = new Map<string, HomeGame[]>()
    for (const game of games) {
      const title = game.groupName?.trim() || game.gameName
      const list = byGroup.get(title)
      if (list) list.push(game)
      else byGroup.set(title, [game])
    }
    return Array.from(byGroup, ([title, items]) => ({ title, items }))
  }, [games])
  return (
    <div id="Home_Floor_Dubai">
      {groups.map((group) => (
        <div key={group.title} className="mb-3 last:mb-0">
          <div className="flex items-center mb-2">
            <HomeSpriteIcon pos="dubaiIcon" className="size-6" />
            <p className="text-sm font-bold text-main ml-1">{group.title}</p>
          </div>
          <div className="w-full grid grid-cols-2 gap-2 mr-2 mb-2">
            {group.items.map((game) => <DubaiCard key={game.gameId + '' + game.countDown} item={game} currentTime={currentTime} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

const keralaColors: Record<string, string> = {
  'Online-Official': '#CF3F57',
  SAMRUDHI: '#E15756',
  KARUNYA: '#684CE7',
  'SUVARNA KERALAM': '#0C91D2',
  'KARUNYA PLUS': '#E5740C',
  DHANALEKSHMI: '#48C17B',
  'STHREE-SAKTHI': '#CF28A9',
  BHAGYATHARA: '#65C316',
}

const KeralaCard = ({ v, currentTime }: { v: HomeGameItem; currentTime: number }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [remain, closed] = useMemo(() => {
    const now = Date.now()
    const draw = v.drawTime * 1000
    return draw < now ? [0, true] : [draw ? Math.round((draw - now) / 1000) : 0, false]
  }, [v])

  return (
    <ClosedWrapper
      closed={closed}
      emergencyStop={v.emergencyStop === 1}
      drawInProgress={v.drawInProgress === 1}
      gameName="Kerala"
      onPress={() => navigate(`/games/kerala?id=${v.gameId}&code=${v.gameCode}`)}
      className="rounded relative shrink-0 overflow-hidden text-white col-span-1 h-26.5 shadow-sm"
      style={{ background: keralaColors[v.gameName] || 'var(--basic-color-primary)' }}
    >
      <GameImage
        imgId={v.imgId} variant="original256" src={v.gamePic} radius="none" removeWrapper
        className="absolute left-0 top-0 z-0 size-full object-cover"
      />
      <div
        className="absolute left-0 bottom-0 z-10 w-full h-14"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,.6), transparent)' }}
      />
      <div className="absolute left-0 bottom-0 z-20 w-full flex items-center justify-between p-2">
        <CountdownTimer flip showDay hiddenSecWhenShowDay remain={remain} currentTime={currentTime} resetTime={0} />
        <div className="bg-white rounded-full text-black font-bold text-xs h-5 leading-5 px-3 min-w-12.5 uppercase">
          {t('common.label.play')}
        </div>
      </div>
    </ClosedWrapper>
  )
}

const KeralaSection = ({ games }: { games: HomeGame[] }) => {
  const currentTime = useTickTimer()
  const { renderModal, show } = useInsuranceRulesModal()
  const groups = useMemo(() => {
    const byGroup = new Map<string, HomeGame[]>()
    for (const game of games) {
      const title = game.groupName?.trim() || game.gameName
      const list = byGroup.get(title)
      if (list) list.push(game)
      else byGroup.set(title, [game])
    }
    return Array.from(byGroup, ([title, items]) => ({ title, items }))
  }, [games])
  return (
    <div id="Home_Floor_Kerala">
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Button className="p-0 h-26.5 col-span-2" onPress={show}>
          <HomeSpriteIcon pos="compensationBannerBg" className="size-full" />
        </Button>
      </div>
      {groups.map((group) => (
        <div key={group.title} className="mb-3 last:mb-0">
          <div className="flex items-center mb-2">
            <HomeSpriteIcon pos="keralaIcon" className="size-6" />
            <p className="text-sm font-bold text-main ml-1">{group.title}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {group.items.map((game) => <KeralaCard key={game.gameCode + game.gameId + game.countDown} v={game} currentTime={currentTime} />)}
          </div>
        </div>
      ))}
      {renderModal}
    </div>
  )
}

const ThreeDigitCard = ({ v, currentTime }: { v: HomeGameItem; currentTime: number }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    if (v.isQuick) return
    const id = setInterval(() => { setClosed(v.drawTime < Date.now() / 1000) }, 1000)
    return () => clearInterval(id)
  }, [])

  const remain = useMemo(() => {
    if (v.isQuick) {
      const now = new Date()
      return (v.cycle - now.getMinutes() % v.cycle) * 60 - now.getSeconds()
    }
    return closed ? 0 : v.countDown
  }, [v.isQuick, v.cycle, v.countDown, closed])

  return (
    <ClosedWrapper
      closed={closed}
      emergencyStop={v.emergencyStop === 1}
      drawInProgress={v.drawInProgress === 1}
      gameName={v.gameName}
      onPress={() => navigate(`/games/digit?id=${v.gameId}&pickName=${v.gameName}&cycle=${v.cycle}&pickGameType=${v.isQuick ? 'quick' : 'normal'}`)}
      className="rounded relative shrink-0 overflow-hidden col-span-1 h-26.5 shadow-sm"
    >
      <GameImage
        imgId={v.imgId} variant="original256" src={v.gamePic} radius="none" removeWrapper
        className="absolute left-0 top-0 z-0 size-full object-cover"
      />
      <div
        className="absolute left-0 bottom-0 z-10 w-full h-14"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,.6), transparent)' }}
      />
      <div className="absolute left-0 bottom-0 z-20 w-full flex items-center justify-between p-2">
        <CountdownTimer flip remain={remain} currentTime={currentTime} resetTime={v.isQuick ? v.cycle * 60 : 0} />
        <div className="bg-white rounded-full text-black font-bold text-xs h-5 leading-5 px-3 min-w-12.5 uppercase">
          {t('common.label.play')}
        </div>
      </div>
    </ClosedWrapper>
  )
}

const ThreeDigitSection = ({ games }: { games: HomeGame[] }) => {
  const currentTime = useTickTimer()
  const groups = useMemo(() => {
    const byGroup = new Map<string, HomeGame[]>()
    for (const game of games) {
      const title = game.groupName?.trim() || game.gameName
      const list = byGroup.get(title)
      if (list) list.push(game)
      else byGroup.set(title, [game])
    }
    return Array.from(byGroup, ([title, items]) => ({ title, items }))
  }, [games])
  return (
    <div id="Home_Floor_3d">
      {groups.map((group) => (
        <div key={group.title} className="mb-3 last:mb-0">
          <div className="flex items-center mb-2">
            <HomeSpriteIcon pos="3dIcon" className="size-6" />
            <p className="text-sm font-bold text-main ml-1">{group.title}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {group.items.map((game) => (
              <ThreeDigitCard key={game.gameId} v={game} currentTime={currentTime} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const FiveDigitCard = ({ item, currentTime, fullWidth }: { item: HomeGameItem; currentTime: number; fullWidth?: boolean }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const remain = useMemo(() => item.countDown > 0 ? item.countDown : 0, [item])

  return (
    <ClosedWrapper
      gameName="4D&5D Lottery"
      closed={item.countDown < 0}
      emergencyStop={item.emergencyStop === 1}
      drawInProgress={item.drawInProgress === 1}
      className={clsx('rounded relative h-28 shadow-sm', fullWidth && 'col-span-2')}
      onPress={() => navigate(`/games/5d?id=${item.gameId}&price=${item.sellingPrice}`)}
    >
      <GameImage imgId={item.imgId} variant="original256" src={item.gamePic} className="size-full" classNames={{ wrapper: 'size-full absolute left-0 top-0' }} />
      <div className="absolute left-0 bottom-0 z-10 w-full h-14" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.6), transparent)' }} />
      <div className="absolute left-0 bottom-0 z-20 w-full flex items-center justify-between p-2">
        <CountdownTimer flip remain={remain} currentTime={currentTime} resetTime={item.isQuick ? 120 : 0} />
        <div className="bg-white rounded-full text-black font-bold text-xs h-5 leading-5 px-3 min-w-12.5 uppercase">
          {t('common.label.play')}
        </div>
      </div>
    </ClosedWrapper>
  )
}

const FiveDigitWideCard = ({ item, currentTime }: { item: HomeGameItem; currentTime: number }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const remain = useMemo(() => item.countDown, [item])

  return (
    <ClosedWrapper
      gameName="4D&5D Lottery"
      closed={item.countDown < 0}
      emergencyStop={item.emergencyStop === 1}
      drawInProgress={item.drawInProgress === 1}
      className="col-span-2 relative h-28 shadow-sm"
      onPress={() => navigate(`/games/5d?id=${item.gameId}`)}
    >
      <GameImage imgId={item.imgId} variant="original512" src={item.gamePic} className="size-full" classNames={{ wrapper: 'size-full absolute left-0 top-0' }} />
      <div className="absolute left-0 bottom-0 z-10 w-full h-14" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.6), transparent)' }} />
      <div className="absolute left-0 bottom-0 z-20 w-full flex items-center justify-between p-2">
        <CountdownTimer flip remain={remain} currentTime={currentTime} resetTime={item.isQuick ? 120 : 0} />
        <div className="bg-white rounded-full text-black font-bold text-xs h-5 leading-5 px-3 min-w-12.5 uppercase">
          {t('common.label.play')}
        </div>
      </div>
    </ClosedWrapper>
  )
}

const FiveDigitSection = ({ games }: { games: HomeGame[] }) => {
  const currentTime = useTickTimer()
  const groups = useMemo(() => {
    const byGroup = new Map<string, HomeGame[]>()
    for (const game of games) {
      const title = game.groupName?.trim() || game.gameName
      const list = byGroup.get(title)
      if (list) list.push(game)
      else byGroup.set(title, [game])
    }
    return Array.from(byGroup, ([title, items]) => ({ title, items }))
  }, [games])
  return (
    <div id="Home_Floor_5d">
      {groups.map((group) => (
        <div key={group.title} className="mb-3 last:mb-0">
          <div className="flex items-center mb-2">
            <HomeSpriteIcon pos="5dIcon" className="size-6" />
            <p className="text-sm font-bold text-main ml-1">{group.title}</p>
          </div>
          <div className="w-full grid grid-cols-2 gap-2 mr-2 mb-2">
            {group.items.map((game, idx) =>
              idx === 2
                ? <FiveDigitWideCard key={game.gameId} item={game} currentTime={currentTime} />
                : <FiveDigitCard key={game.gameId} item={game} currentTime={currentTime} fullWidth={group.items.length === 1} />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

const RunGuessSection = ({ game }: { game: HomeGameItem }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const emergencyStop = game.emergencyStop === 1

  const goRace = () => {
    if (emergencyStop) {
      import('../utils/toast').then(({ toast }) => toast.show({ icon: 'warning', message: t('common.tip.gameStopped') }))
      return
    }
    navigate(`/games/race/${game.gameId}?runnerCount=${game.runnerCount ?? (game.gameName === 'Run & Guess Basic' ? 6 : 12)}`)
  }

  return (
    <div id="Home_Floor_Race">
      <div className="flex items-center mb-2">
        <HomeSpriteIcon pos="raceIcon" className="size-6" />
        <p className="text-sm font-bold text-main ml-1">Run & Guess</p>
      </div>
      <Button
        className="w-full h-26.5 px-0 rounded relative overflow-hidden shadow-sm"
        onPress={goRace}
      >
        <HomeSpriteIcon pos="raceBg" className="w-full h-26.5" />
        {emergencyStop && (
          <div className="absolute left-0 top-0 size-full bg-black/60 z-20 flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-danger text-white text-xs font-bold uppercase">
              {t('common.label.games.stopped')}
            </span>
          </div>
        )}
      </Button>
    </div>
  )
}

const LUCKY_SPIN_FALLBACK_IMG = '/images/lucky-spin/lucky-spin-bg.webp'

const LuckySpinCard = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [info, setInfo] = useState<LuckySpinInfoDto | null>(null)

  useEffect(() => {
    getLuckySpinInfo().then((d) => setInfo(d)).catch(() => {})
  }, [])

  const bannerSrc = info?.banner ? info.banner : LUCKY_SPIN_FALLBACK_IMG
  const iconSrc = info?.image ? info.image : LUCKY_SPIN_FALLBACK_IMG

  return (
    <div id="Home_Floor_LuckySpin" className="mb-3 last:mb-0">
      <div className="flex items-center mb-2">
        <img src={resolveAssetUrl(iconSrc)} alt="" className="size-6 rounded object-cover mr-1" />
        <p className="text-sm font-bold text-main">{t('luckyspin.label.title')}</p>
      </div>
      <Button
        className="w-full h-26.5 px-0 rounded relative overflow-hidden shadow-sm"
        onPress={() => navigate('/index/lucky-spin')}
      >
        <GameImage
          src={bannerSrc}
          radius="none"
          removeWrapper
          alt="Lucky Spin"
          className="absolute left-0 top-0 z-0 size-full object-cover"
        />
        <div
          className="absolute left-0 bottom-0 z-10 w-full h-14"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,.6), transparent)' }}
        />
        <div className="absolute left-0 bottom-0 z-20 w-full flex items-center justify-end p-2">
          <div className="bg-white rounded-full text-black font-bold text-xs h-5 leading-5 px-3 min-w-12.5 uppercase">
            {t('common.label.play')}
          </div>
        </div>
      </Button>
    </div>
  )
}

const MysteryBoxCard = ({ v, i }: { v: MysteryBoxGroup; i: number }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const emergencyStop = v.emergencyStop === 1

  const handleClick = () => {
    if (emergencyStop) {
      import('../utils/toast').then(({ toast }) => toast.show({ icon: 'warning', message: t('common.tip.gameStopped') }))
      return
    }
    navigate('/games/mystery-box?price=' + v.price)
  }

  return (
    <div
      className={clsx(
        'rounded-sm p-2 flex flex-col relative items-center overflow-hidden shadow-sm',
        i < 2 ? 'col-span-3' : 'col-span-2',
      )}
      onClick={handleClick}
      style={{ background: useAppConfigStore.getState().mysteryBoxGradients?.[i] || mysteryBoxGradients[i] }}
    >
      {emergencyStop && (
        <div className="absolute left-0 top-0 size-full bg-black/60 z-30 flex items-center justify-center">
          <span className="px-3 py-1 rounded-full bg-danger text-white text-xs font-bold uppercase">
            {t('common.label.games.stopped')}
          </span>
        </div>
      )}
      {v.totalFreeCount > 0 ? (
        <div className="h-5 w-17 bg-[#EA1200] absolute -left-4.5 top-1.5 -rotate-45 z-20 text-9 font-bold text-white flex items-center justify-center">
          Free &times; {v.totalFreeCount}
        </div>
      ) : null}
      <div className="w-full h-16">
        <GameImage
          alt={v.gameName}
          src={v.cover}
          imgId={v.coverImgID}
          variant={i < 2 ? 'original256' : 'original128'}
          className="size-full"
          removeWrapper
        />
      </div>
      <Button
        className="h-6 rounded-sm w-full mt-2 border border-white justify-around bg-transparent bg-linear-to-b py-1 from-white to-white/60 gap-0 text-xs font-bold"
        onPress={handleClick}
      >
        <div className="flex items-baseline text-black">
          {formatCurrency(v.price, 0)}
          <span className="text-8 font-normal">/{t('common.label.ticket')}</span>
        </div>
      </Button>
    </div>
  )
}

const MysteryBoxGrid = () => {
  const { t } = useTranslation()
  const [listGroupByPrice, setListGroupByPrice] = useState<MysteryBoxGroup[]>([])

  const fetchList = () => {
    getMysteryBoxGameList().then((data) => {
      setListGroupByPrice(groupByPrice(data || []))
    }).catch(() => {})
  }

  useEffect(() => {
    fetchList()
  }, [])

  if (listGroupByPrice.length === 0) return null

  return (
    <div id="Home_Floor_MysteryBox" className="mt-2">
      <div className="flex items-center mb-2">
        <HomeSpriteIcon pos="mysteryBoxIcon" className="size-6" />
        <p className="text-sm font-bold text-main ml-1">{t('common.label.mysteryBox')}</p>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {listGroupByPrice.map((item, idx) => (
          <MysteryBoxCard key={idx} v={item} i={idx} />
        ))}
      </div>
    </div>
  )
}

type LotteryFilterSpec = { label: string; key: string; filterType?: string; hot?: 'K3' | 'WinGo' }

const LOTTERY_FILTER_SPECS: LotteryFilterSpec[] = [
  { label: 'Dice', key: 'Hot_Game', hot: 'K3' },
  { label: 'Color', key: 'Hot_Game', hot: 'WinGo' },
  { label: '4 & 5 Digit', key: '5d', filterType: 'Digit4&5' },
  { label: 'Run & Guess', key: 'Race', filterType: 'Run&Guess' },
  { label: 'Dubai', key: 'Dubai', filterType: 'DubaiLottery' },
  { label: '3 Digit', key: '3d', filterType: '3Digits' },
  { label: 'Kerala', key: 'Kerala', filterType: 'Kerala' },
]

const LotteryTab = ({ isActive }: { isActive: boolean }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const rem = useUIStore((s) => s.rem)
  const [sections, setSections] = useState<HomeSection[]>([])
  const [loading, setLoading] = useState(true)

  const [k3Game, wingoGame, filteredSections] = useMemo<[HomeGame | undefined, HomeGame | undefined, HomeSection[]]>(() => {
    const k3 = sections.find((sec) => sec.filterType === 'K3')?.games?.[0]
    const wingo = sections.find((sec) => sec.filterType === 'WinGo')?.games?.[0]
    const rest = sections.filter((sec) =>
      ['Run&Guess', 'DubaiLottery', '3Digits', 'Kerala', 'Digit4&5'].includes(sec.filterType)
    )
    return [k3, wingo, rest]
  }, [sections])

  const visibleFilters = useMemo(() => {
    const hasSection = (ft: string) =>
      sections.some((sec) => sec.filterType === ft && (sec.games?.length ?? 0) > 0)
    return LOTTERY_FILTER_SPECS.filter((f) =>
      f.hot === 'K3'
        ? !!k3Game
        : f.hot === 'WinGo'
          ? !!wingoGame
          : f.filterType
            ? hasSection(f.filterType)
            : false,
    )
  }, [sections, k3Game, wingoGame])

  useEffect(() => {
    if (isActive) {
      withLoading(setLoading, fetchHomeGameList({ categoryId: GAME_CATEGORY.lottery }).then((data) => {
        setSections(data?.list || [])
      }))
    }
  }, [isActive])

  const goGame = (game: HomeGame) => {
    if (game?.provider !== 'TK') return
    if (game.emergencyStop === 1) {
      import('../utils/toast').then(({ toast }) => toast.show({ icon: 'warning', message: t('common.tip.gameStopped') }))
      return
    }
    const path = buildGamePath(game)
    if (path) navigate(path)
  }

  const scrollToSection = (key: string) => {
    const container = document.getElementById('HOME_CONTAINER')
    const target = document.querySelector('#Home_Floor_' + key)
    if (container && target) {
      const top = container.getBoundingClientRect().top
      const offset = target.getBoundingClientRect().top - top - 4.875 * rem
      container.scrollTo({ top: container.scrollTop + offset, behavior: 'smooth' })
    }
  }

  return (
    <div className="px-3">

      {visibleFilters.length > 0 && (
        <div className="py-2 -mt-2 flex items-center overflow-x-auto sticky left-0 top-18.5 bg-light-gray z-30">
          {visibleFilters.map((filter) => (
            <Button
              key={filter.label}
              className="shrink-0 h-auto text-10! py-1! px-2! mr-1 rounded-full border border-text-acc text-acc duration-200 active:border-primary active:text-primary"
              onPress={() => scrollToSection(filter.key)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      )}

      {(k3Game || wingoGame) && (
        <div className="grid grid-cols-2 gap-2 h-26.5" id="Home_Floor_Hot_Game">
          {k3Game && (
            <Button className={clsx('h-full p-0 relative overflow-hidden', !wingoGame && 'col-span-2')} onPress={() => goGame(k3Game)}>
              <HomeSpriteIcon className="size-full" pos="k3Bg" />
              {k3Game.emergencyStop === 1 && (
                <div className="absolute left-0 top-0 size-full bg-black/60 z-20 flex items-center justify-center">
                  <span className="px-3 py-1 rounded-full bg-danger text-white text-xs font-bold uppercase">
                    {t('common.label.games.stopped')}
                  </span>
                </div>
              )}
            </Button>
          )}
          {wingoGame && (
            <Button className={clsx('h-full p-0 relative overflow-hidden', !k3Game && 'col-span-2')} onPress={() => goGame(wingoGame)}>
              <HomeSpriteIcon pos="wingoBg" className="size-full" />
              {wingoGame.emergencyStop === 1 && (
                <div className="absolute left-0 top-0 size-full bg-black/60 z-20 flex items-center justify-center">
                  <span className="px-3 py-1 rounded-full bg-danger text-white text-xs font-bold uppercase">
                    {t('common.label.games.stopped')}
                  </span>
                </div>
              )}
            </Button>
          )}
        </div>
      )}

      {filteredSections.map((section, sIdx) => {
        const sectionGames = section.games
        if (!sectionGames || sectionGames.length === 0) return null
        let content: React.ReactNode = null
        switch (section.filterType) {
          case 'Run&Guess':
            content = <RunGuessSection game={sectionGames[0]} />; break
          case 'DubaiLottery':
            content = <><DubaiSection games={sectionGames} /><LuckySpinCard /></>; break
          case 'Kerala':
            content = <KeralaSection games={sectionGames} />; break
          case '3Digits':
            content = <ThreeDigitSection games={sectionGames} />; break
          case 'Digit4&5':
            content = <FiveDigitSection games={sectionGames} />; break
        }
        return <div key={section.filterType + '' + sIdx} className="mt-2">{content}</div>
      })}

      <MysteryBoxGrid />

      {loading && filteredSections.length === 0 && (
        <div className="flex justify-center mt-2 h-40">
          <Spin loading />
        </div>
      )}
    </div>
  )
}

const BannerItem = ({ v }: { v: HomeBanner }) => (
  <div className="p-3" onClick={() => { v.skipUrl && handleSkipUrl(v.skipUrl) }}>
    <div className="rounded h-30 relative overflow-hidden">
      <Skeleton className="size-full rounded-sm absolute left-0 top-0 bg-gray!" />
      <GameImage
        className="w-full rounded-sm h-30 absolute left-0 top-0"
        radius="none"
        removeWrapper
        alt={v.id + ''}
        src={v.img}
        imgId={v.imgId}
        variant="banner"
      />
    </div>
  </div>
)

const BannerCarousel = ({ banners }: { banners: HomeBanner[] }) => {
  const [activeIdx, setActiveIdx] = useState(0)

  if (banners.length === 1) {
    return (
      <div className="h-36 shrink-0">
        <BannerItem v={banners[0]} />
      </div>
    )
  }

  if (banners.length > 0) {
    return (
      <Slider
        dots
        arrows={false}
        infinite
        speed={500}
        autoplay
        autoplaySpeed={5000}
        className="home-banner-slider relative h-36 shrink-0"
        accessibility={false}
        appendDots={() => (
          <ul className="list-none p-0 m-0">
            {banners.map((_, idx) => (
              <li
                key={idx}
                className={
                  idx === activeIdx
                    ? 'bg-primary w-3 rounded-xs  size-1'
                    : 'bg-light-gray opacity-[.7] w-3 rounded-xs  size-1'
                }
              />
            ))}
          </ul>
        )}
        beforeChange={(_: number, next: number) => setActiveIdx(next)}
      >
        {banners.map((b) => (
          <BannerItem v={b} key={b.id} />
        ))}
      </Slider>
    )
  }

  return (
    <div className="p-3 h-36 shrink-0">
      <Skeleton className="size-full bg-gray! rounded-sm" />
    </div>
  )
}

export const HomePage = () => {
  const { t } = useTranslation()
  const rem = useUIStore((s) => s.rem)
  const [banners, setBanners] = useState<HomeBanner[]>([])
  const [showBackTop, setShowBackTop] = useState(false)
  const [hideFloating, setHideFloating] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const showDownload = localStorage.getItem('showDownload') === 'true'

  useEffect(() => {
    fetchAndSyncBalance()
    getBannerList().then((data) => setBanners(data || [])).catch(() => {})
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    setShowBackTop(target.scrollTop > window.innerHeight * 0.67)

    setHideFloating(true)
    clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = setTimeout(() => setHideFloating(false), 200)
  }, [])

  const scrollToTop = () => {
    document.getElementById('HOME_CONTAINER')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="size-full relative">

      <div
        ref={scrollRef}
        id="HOME_CONTAINER"
        className="flex flex-col h-full relative overflow-y-auto overflow-x-hidden pb-16"
        onScroll={handleScroll}
      >

        <HomeHeader />

        <DownloadBanner />

        <div className="relative flex flex-col">

          <BannerCarousel banners={banners} />

          <div className="sticky top-11 left-0 z-31 px-3 bg-light-gray">
            <Banner
              rightNode={showDownload ? (
                <Button
                  className="h-5 rounded-full bg-linear-to-b from-[#71DEFF] to-[#2954FF] px-2 gap-0 animate-scale animate-infinite scale-start-100 scale-via-120"
                  onPress={triggerDownload}
                >
                  <DownloadIcon className="mr-1 size-3! text-white dark:text-main" />
                  <span className="font-black text-white dark:text-main text-10">APP</span>
                </Button>
              ) : undefined}
            />
          </div>

          <CheckInCashReward />

          <div className="relative bg-light-gray">
            <LotteryTab isActive />
          </div>
        </div>

        <OfficialChannels />

        <FooterDisclaimers />
      </div>

      <FloatingActions hide={hideFloating} />

      <div
        className={clsx(
          'fixed bottom-16 duration-400 right-1/2 z-52',
          showBackTop && !hideFloating ? '-mr-46 opacity-100' : '-mr-60 opacity-0',
        )}
        onClick={scrollToTop}
      >
        <Image src="/images/home/back-to-top.webp" radius="full" className="size-14" />
      </div>
    </div>
  )
}

export default HomePage
