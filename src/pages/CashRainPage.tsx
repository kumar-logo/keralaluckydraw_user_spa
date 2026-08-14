import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, ScrollShadow, Image, Modal, ModalContent } from '@nextui-org/react'
import clsx from 'clsx'
import { getCashRewardInfo, startCashReward, endCashReward } from '../services/cashRewardApi'
import { useUIStore } from '../stores/uiStore'
import { formatCurrency } from '../utils/format'
import { toast } from '../utils/toast'
import { withLoading, resolveAssetUrl } from '../utils/helpers'
import { fetchAndSyncBalance } from '../utils/fetchBalance'
import { useAudio } from '../hooks/useAudio'
import { TopBar } from '../components/shared/TopBar'
import { GameImage } from '../components/shared/GameImage'
import { NavBarSpacer } from '../components/shared/NavBarSpacer'

interface JarReward {
  amount: number
  notMe?: boolean
  avatar?: string
}

interface ActiveJar extends JarReward {
  id: number
  left: number
  speed: number
  col: number
}

interface RewardRecord {
  nickName: string
  avatar?: string
  time: string | number
  prize: number
}

interface RewardInfo {
  isActivity: boolean
  lessSec: number
  gameID: number
  roundNo: number
  alreadyPlay?: boolean
  alreadyRecharge?: boolean
  nextRoundDate?: string
  roundDate?: string
  otherRecord?: RewardRecord[]
  userRecord?: RewardRecord[]
}

const SPRITE_BASE = {
  backgroundImage: 'url(/images/cash-reward/reward-sprite.webp)',
  backgroundSize: '51.375rem 32.375rem',
} as const

const SPRITE_POSITIONS = {
  halfLeft: 'left 0 top 0',
  halfRight: 'left -3.875rem top 0',
  openJarBtn: 'left -7.75rem top 0',
  jarBgLight: 'left -9.675rem top 0',
  topLight: 'left 0 bottom 0',
  prizeJar: 'left 0 top -5.625rem',
  prizeBgLight: 'right 0 top 0',
  bigMoneyJar: 'left -14.75rem top 0',
}

const PrizeValue = ({ value, className, style, children }: { value?: number; className?: string; style?: React.CSSProperties; children?: React.ReactNode }) => {
  const { t } = useTranslation()
  return (
    <span className={clsx('text-[#fff82e] font-black text-shadow-[0_0_3px_#000] relative z-20', className)} style={style}>
      {children ?? (value ? formatCurrency(value, 2, true) : t('common.label.empty') + '...')}
    </span>
  )
}

const JarHalf = ({ right, mask, isOpen }: { right?: boolean; mask?: boolean; isOpen?: boolean }) => (
  <div
    className={clsx(
      'absolute left-0 top-0 size-full duration-200',
      mask ? (right ? 'mask-img mask-img-right' : 'mask-img mask-img-left') : '',
    )}
    style={{
      ...SPRITE_BASE,
      backgroundPosition: right ? SPRITE_POSITIONS.halfRight : SPRITE_POSITIONS.halfLeft,
      transform: isOpen ? (right ? 'rotate(3deg)' : 'rotate(-3deg)') : '',
      transformOrigin: 'center bottom',
    }}
  />
)

const JarContainer = ({ children, isOpen = false, mask = false }: { children?: React.ReactNode; isOpen?: boolean; mask?: boolean }) => (
  <div className="w-15 h-16 relative">
    <JarHalf isOpen={isOpen} mask={mask} />
    <JarHalf isOpen={isOpen} mask={mask} right />
    {children}
  </div>
)

const JarItem = ({ item, onOpen }: { item: JarReward; onOpen: () => void }) => {
  const [opened, setOpened] = useState(false)
  const [amount, setAmount] = useState(0)
  const emptyAudio = useAudio('/audio/open-empty.wav')
  const cashAudio = useAudio('/audio/open-cash.wav')

  return (
    <div
      className={clsx(
        'size-20 flex items-center justify-center relative z-20 delay-200 duration-1000',
        opened ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100',
      )}
      onTouchStart={() => {
        if (item.notMe || opened) return
        setAmount(item.amount)
        setOpened(true)
        onOpen()
        if (item.amount) {
          cashAudio.stop()
          requestAnimationFrame(() => { cashAudio.play() })
        } else {
          emptyAudio.stop()
          requestAnimationFrame(() => { emptyAudio.play() })
        }
      }}
    >

      <div
        className="absolute size-full left-0 top-0 duration-200 pointer-events-none"
        style={{
          ...SPRITE_BASE,
          backgroundPosition: SPRITE_POSITIONS.jarBgLight,
          opacity: opened && amount === 0 ? 0 : 1,
          scale: 1.5,
        }}
      />
      <JarContainer isOpen={opened} mask={(amount === 0 && opened) || item.notMe}>
        {item.notMe ? (
          <div className="size-full flex flex-col items-center justify-center pt-1.5">
            <Image src={resolveAssetUrl(item.avatar)} className="size-6 border border-white rounded-full" />
            <PrizeValue value={item.amount} className="mr-0.5 text-xs" />
          </div>
        ) : (
          <div className="size-full relative flex items-center justify-center">
            <PrizeValue
              value={amount}
              className={clsx('mr-0.5 mt-3 duration-400', amount > 0 ? 'din text-base' : 'text-10')}
              style={{
                transform: opened ? 'scale(1)' : 'scale(0)',
                opacity: opened ? 1 : 0,
              }}
            />
            <Button
              className="size-7 p-0 min-w-auto absolute left-1/2 top-1/2 -ml-3.5 -mt-2.5 rounded-full"
              style={{
                ...SPRITE_BASE,
                backgroundPosition: SPRITE_POSITIONS.openJarBtn,
                pointerEvents: opened ? 'none' : 'auto',
                transform: opened ? 'scale(1.25)' : 'scale(1)',
                opacity: opened ? 0 : 1,
              }}
              onPress={(e: { continuePropagation?: () => void }) => { e.continuePropagation?.() }}
            />
          </div>
        )}
      </JarContainer>
    </div>
  )
}

const TopLight = () => {
  const [top, setTop] = useState('-12.625rem')
  useEffect(() => { requestAnimationFrame(() => setTop('0rem')) }, [])
  return (
    <div className="absolute left-0 flex justify-center w-full duration-200" style={{ top }}>
      <div className="w-75 h-50.5" style={{ ...SPRITE_BASE, backgroundPosition: SPRITE_POSITIONS.topLight }} />
    </div>
  )
}

const PrizeBgLight = ({ children }: { children: React.ReactNode }) => (
  <div className="flex justify-center w-full h-124 relative">
    <div
      className="size-124 absolute left-1/2 top-1/2 -ml-62 -mt-62 flex justify-center items-center"
      style={{ ...SPRITE_BASE, backgroundPosition: SPRITE_POSITIONS.prizeBgLight }}
    >
      {children}
    </div>
  </div>
)

const PrizeJar = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={clsx('size-56 flex justify-center items-center', className)} style={{ ...SPRITE_BASE, backgroundPosition: SPRITE_POSITIONS.prizeJar }}>
    {children}
  </div>
)

const BigMoneyJar = () => (
  <div className="size-22" style={{ ...SPRITE_BASE, backgroundPosition: SPRITE_POSITIONS.bigMoneyJar }} />
)

const usePrizeCelebration = (onCollect: () => void) => {
  const [prize, setPrize] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const winAudio = useAudio('/audio/win.mp3')

  const showPrize = (amount: number) => {
    setPrize(amount)
    winAudio.play()
    setIsOpen(true)
  }

  const render = (
    <Modal
      isOpen={isOpen}
      onOpenChange={(o) => { if (!o) setIsOpen(false) }}
      hideCloseButton
      isDismissable={false}
      classNames={{ base: 'bg-transparent size-full shadow-none', backdrop: 'bg-transparent' }}
    >
      <ModalContent className="size-full m-0! flex justify-center items-center">
        <PrizeBgLight>
          <PrizeJar className="-mt-5">
            <div className="flex flex-col items-center mt-20">
              <PrizeValue className="text-3xl!">{formatCurrency(prize)}</PrizeValue>
              <span className="text-shadow-[0_2px_4px_#000] text-base font-bold text-main">Bonus</span>
            </div>
          </PrizeJar>
          <div className="flex flex-col items-center w-full absolute bottom-19 left-0">
            <Button
              className="text-[#744b0b] font-bold text-shadow-[0_1px_0_#ffffce99] border-2 border-[#9E1203] h-13 min-w-32 rounded-full text-base"
              style={{
                backgroundImage: 'linear-gradient(180deg, #FFFEE2 0%, #FFEB72 42.31%, #C58420 78.85%, #FFFA73 100%)',
                boxShadow: '0 4px 10px 0 rgba(94, 0, 0, 0.70)',
              }}
              onPress={() => { setIsOpen(false); onCollect() }}
            >
              GET
            </Button>
          </div>
        </PrizeBgLight>
      </ModalContent>
    </Modal>
  )

  return { showPrize, render }
}

const RainGame = ({ rewardList, onFinish, gameID, roundNo }: { rewardList: JarReward[]; onFinish: () => void; gameID: number; roundNo: number }) => {
  const { t } = useTranslation()
  const [started, setStarted] = useState(false)
  const running = useRef(false)
  const [collectedAmounts, setCollectedAmounts] = useState<number[]>([])
  const [countdown, setCountdown] = useState(10)
  const screenWidth = useUIStore((s) => s.screenWidth)
  const bgm = useAudio('/audio/cash-reward-bgm.mp3')

  const totalPrize = useMemo(() => collectedAmounts.reduce((a, b) => a + b, 0) ?? 0, [collectedAmounts])
  const { showPrize, render: prizeRender } = usePrizeCelebration(onFinish)

  useEffect(() => {
    if (rewardList.length === 0) return
    const timer = setTimeout(() => {
      setStarted(true)
      running.current = true
    }, 3500)
    return () => clearTimeout(timer)
  }, [rewardList])

  useEffect(() => {
    if (!started) return
    const interval = setInterval(() => {
      setCountdown((c) => c - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [started])

  useEffect(() => {
    if (started) bgm.play()
    else bgm.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started])

  useEffect(() => {
    if (countdown > 0) return
    setStarted(false)
    running.current = false
    endCashReward(gameID, roundNo, totalPrize)
      .then(() => {
        showPrize(collectedAmounts.reduce((a, b) => a + b, 0) ?? 0)
        fetchAndSyncBalance()
      })
      .catch(() => onFinish())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown])

  const colWeights = [0, 1, 1, 2, 2, 2, 3, 3, 4]
  const pickColumn = () => colWeights[Math.floor(Math.random() * colWeights.length)]

  const [activeJars, setActiveJars] = useState<ActiveJar[]>([])

  useEffect(() => {
    if (!started || !rewardList.length) return
    let idx = 0
    const spawn = () => {
      if (!running.current || idx >= rewardList.length) return
      const count = Math.random() < 0.7 ? 2 : 1
      const batch = rewardList.slice(idx, idx + count)
      idx += count

      batch.forEach((item) => {
        const col = pickColumn()
        const left = (col / 5) * 100 + Math.random() * 15
        const speed = 140 + Math.random() * 40
        const id = Date.now() + Math.random()
        const jar = { ...item, id, left, speed, col }
        setActiveJars((prev) => [...prev, jar])

        setTimeout(() => {
          setActiveJars((prev) => prev.filter((j) => j.id !== id))
        }, (screenWidth / speed) * 1000 + 2000)
      })

      const gap = 200 + Math.random() * 100
      setTimeout(spawn, gap)
    }
    spawn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started])

  return (
    <>
      <div className="size-full relative overflow-hidden">

        {started && <TopLight />}

        {activeJars.map((jar) => (
          <div
            key={jar.id}
            className="absolute z-60 animate-fall"
            style={{
              left: `${jar.left}%`,
              top: '-5rem',
              animation: `rainFall ${(screenWidth / jar.speed) * 4}s linear forwards`,
            }}
          >
            <JarItem
              item={jar}
              onOpen={() => {
                if (jar.amount && collectedAmounts.length < 8) {
                  setCollectedAmounts((prev) => [...prev, jar.amount])
                }
              }}
            />
          </div>
        ))}

        <div
          className="absolute z-70 duration-200 left-0 h-65 w-full bg-linear-to-b from-white/0 to-[#220000] to-85% flex flex-col items-center"
          style={{
            bottom: started ? '0' : '-16.25rem',
            opacity: started ? 1 : 0,
          }}
        >

          <div className="flex justify-center din font-black text-main text-[2.5rem] leading-12 pointer-events-none relative">
            <div className="animate-ping absolute size-full flex items-center justify-center">
              {countdown} s
            </div>
            {countdown} s
          </div>
          <div className="flex justify-center text-main/60 text-xs">
            {t('common.label.games.remainTime')}
          </div>

          <div className="flex items-center justify-center mt-6 mb-4">
            <div className="h-1 w-6 rounded-full bg-clip-content bg-linear-to-l from-[#fcf1b0] to-[#b51d04]" />
            <div className="size-1 bg-[#fcf1b0] ml-1 rounded-full" />
            <div className="text-transparent bg-clip-text bg-linear-to-b from-[#fff9b6] to-[#b41800] mx-5">
              {t('cashReward.label.myRewards')}
            </div>
            <div className="size-1 bg-[#fcf1b0] mr-1 rounded-full" />
            <div className="h-1 w-6 rounded-full bg-clip-content bg-linear-to-r from-[#fcf1b0] to-[#b51d04]" />
          </div>

          <div className="w-full flex justify-center items-center">
            <BigMoneyJar />
            <div className="flex flex-col items-start ml-5">
              <span className="text-main">{t('common.label.amount')}</span>
              <PrizeValue className="din text-3xl">{formatCurrency(totalPrize)}</PrizeValue>
            </div>
          </div>
        </div>
      </div>
      {prizeRender}
    </>
  )
}

const useRainModal = (afterFinish: () => void) => {
  const [isOpen, setIsOpen] = useState(false)
  const [rewardList, setRewardList] = useState<JarReward[]>([])
  const [gameID, setGameID] = useState(0)
  const [roundNo, setRoundNo] = useState(0)

  const start = (list: JarReward[], gid: number, rno: number) => {
    setRewardList(list)
    setGameID(gid)
    setRoundNo(rno)
    setIsOpen(true)
  }

  const render = (
    <Modal
      isOpen={isOpen}
      onOpenChange={(o) => { if (!o) setIsOpen(false) }}
      isDismissable={false}
      hideCloseButton
      classNames={{ backdrop: 'bg-black/80' }}
    >
      <ModalContent className="size-full m-0 rounded-none bg-transparent">
        {rewardList.length > 0 && gameID > 0 && (
          <RainGame
            rewardList={rewardList}
            gameID={gameID}
            roundNo={roundNo}
            onFinish={() => { setIsOpen(false); afterFinish() }}
          />
        )}
      </ModalContent>
    </Modal>
  )

  return { render, start }
}

const IDLE_POLL_MS = 30000

const useCashRainState = () => {
  const [loading, setLoading] = useState(false)
  const [rewardInfo, setRewardInfo] = useState<RewardInfo | null>(null)
  const [isActivity, setIsActivity] = useState(false)
  const countdownRef = useRef(Infinity)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const tickRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const unmountedRef = useRef(false)

  const refresh = useCallback(() => {
    if (typeof document !== 'undefined' && document.hidden) return
    withLoading(setLoading, getCashRewardInfo().then((raw) => {
      if (unmountedRef.current) return
      const data = raw as RewardInfo | null
      setRewardInfo(data)
      setIsActivity(data?.isActivity || false)
      countdownRef.current = data && data.lessSec > 0 ? data.lessSec : 0
    }))
  }, [])

  const { render: rainRender, start: startRain } = useRainModal(() => { refresh() })

  useEffect(() => {
    unmountedRef.current = false
    refresh()
    return () => { unmountedRef.current = true }
  }, [refresh])

  useEffect(() => {
    const clearTimers = () => {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = undefined }
      if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = undefined }
    }
    clearTimers()

    if (!rewardInfo) return clearTimers

    if (rewardInfo.isActivity && rewardInfo.lessSec > 0) {
      countdownRef.current = rewardInfo.lessSec
      tickRef.current = setInterval(() => {
        countdownRef.current -= 1
        if (countdownRef.current <= 0) {
          if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = undefined }
          refresh()
        }
      }, 1000)
    } else {
      idleTimerRef.current = setTimeout(refresh, IDLE_POLL_MS)
    }

    return clearTimers
  }, [rewardInfo, refresh])

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [refresh])

  const getNow = () => {
    if (!isActivity || !rewardInfo) return
    withLoading(setLoading,
      startCashReward(rewardInfo.gameID, rewardInfo.roundNo).then((raw) => {
        startRain(raw as JarReward[], rewardInfo.gameID, rewardInfo.roundNo)
      }),
    )
  }

  return { loading, rewardInfo, isActivity, getRewardRender: rainRender, getNow }
}

const RecordsPanel = ({ className, rewardInfo }: { className?: string; rewardInfo: RewardInfo | null }) => {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)

  const records = useMemo<RewardRecord[]>(
    () => (rewardInfo ? (tab === 0 ? rewardInfo.otherRecord : rewardInfo.userRecord) : []) || [],
    [tab, rewardInfo],
  )

  return (
    <div className={clsx('px-3 pt-4 border-2 border-[#ffefa5] bg-[#5e574266] rounded-lg', className)}>
      <div className="flex">
        <Button
          className={clsx(
            'flex-1 mr-2 border-2 border-[#ff6450] rounded-lg',
            tab === 0 ? 'bg-[#ff6450] text-white' : 'bg-[#0000] text-[#ff6450]',
          )}
          onPress={() => tab !== 0 && setTab(0)}
        >
          {t('cashReward.label.otherUsers')}
        </Button>
        <Button
          className={clsx(
            'flex-1 border-2 border-[#ff6450] rounded-lg',
            tab === 1 ? 'bg-[#ff6450] text-white' : 'bg-[#0000] text-[#ff6450]',
          )}
          onPress={() => tab !== 1 && setTab(1)}
        >
          {t('cashReward.label.myRewards')}
        </Button>
      </div>
      <ScrollShadow className="h-63.5 py-3 text-white">
        {records.length === 0 ? (
          <div className="flex items-center justify-center h-full text-main/50 text-sm">
            {t('common.label.empty')}
          </div>
        ) : (
          records.map((o) => (
            <div key={o.nickName + o.time + o.prize} className="h-11.5 flex items-center justify-between">
              {tab === 0 ? (
                <div className="flex items-center">
                  <GameImage
                    src={resolveAssetUrl(o.avatar)}
                    radius="full"
                    className="size-7 border-1.5 border-white"
                  />
                  <span className="ml-1 text-xs">{o.nickName}</span>
                </div>
              ) : (
                <span className="text-10 text-sec-acc">{o.time}</span>
              )}
              <div className="flex flex-col items-end">
                <span className="text-sm">{formatCurrency(o.prize)}</span>
                {tab === 0 && <span className="text-10 text-sec-acc">{o.time}</span>}
              </div>
            </div>
          ))
        )}
      </ScrollShadow>
    </div>
  )
}

const CHRISTMAS_START = 17663418e5
const CHRISTMAS_END = 1767465e6

export const CashRainPage = () => {
  const { t } = useTranslation()
  const { loading, rewardInfo, isActivity, getRewardRender, getNow } = useCashRainState()
  const [scrollTop, setScrollTop] = useState(0)
  const [isChristmas, setIsChristmas] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const checkChristmas = useCallback(() => {
    const now = Date.now()
    setIsChristmas(now >= CHRISTMAS_START && now < CHRISTMAS_END)
    let target: number | undefined
    if (now < CHRISTMAS_START) target = CHRISTMAS_START
    else if (now < CHRISTMAS_END) target = CHRISTMAS_END
    if (target) {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(checkChristmas, target - now)
    }
  }, [])

  useEffect(() => {
    checkChristmas()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [checkChristmas])

  return (
    <>
      <div className="size-full flex flex-col overflow-hidden bg-[#ea0101] relative">

        <div className="size-0" style={{ backgroundImage: 'url(/images/cash-reward/reward-sprite.webp)' }} />

        <div className="absolute left-0 top-0 w-full h-11 z-10">

          <div
            className="absolute size-full top-0 left-0 pointer-events-none duration-200"
            style={{
              opacity: scrollTop > 40 ? 1 : 0,
              backgroundImage: 'linear-gradient(180deg, #871C17ff 0%, rgba(135, 28, 23, 0) 100%)',
            }}
          />
          <TopBar
            leftIconClassName="text-white!"
            title={<span className="text-white">{t('cashReward.label.title')}</span>}
            className="text-white!"
            background="#0000"
            boxShadow=""
          />
        </div>

        <ScrollShadow
          className="flex-1 overflow-y-auto overflow-x-hidden"
          onScroll={(e: React.UIEvent<HTMLElement>) => { setScrollTop(e.currentTarget.scrollTop ?? 0) }}
        >

          <div
            className="h-145.5 w-full bg-contain flex items-end justify-center overflow-visible relative"
            style={{
              backgroundImage: isChristmas
                ? 'url(/images/cash-reward/bg-12-25.webp)'
                : 'url(/images/cash-reward/bg.webp)',
            }}
          >

            <Button
              className="text-[#744b0b] font-bold text-shadow-[0_1px_0_#ffffce99] border-2 border-[#9E1203] h-13 rounded-full w-75 mb-10 text-base data-[disabled=true]:opacity-100 cus-animate-btn animate-scale-light"
              style={{
                backgroundImage: 'linear-gradient(180deg, #FFFEE2 0%, #FFEB72 42.31%, #C58420 78.85%, #FFFA73 100%)',
                boxShadow: '0 4px 10px 0 rgba(94, 0, 0, 0.70)',
                '--light-start': '-4rem',
                '--light-end': '22.75rem',
                '--light-height': '6rem',
              } as React.CSSProperties}
              isLoading={loading}
              onPress={() => {
                if (!rewardInfo) return
                if (rewardInfo.alreadyPlay) return toast.warning(t('cashReward.tip.alreadyPlayed'))
                if (!isActivity) return toast.warning(t('cashReward.tip.plsWait'))
                if (!rewardInfo.alreadyRecharge) {
                  window.dispatchEvent(new CustomEvent('openRechargeDraw'))
                  return toast.warning(t('cashReward.tip.rechargeFirst'))
                }
                getNow()
              }}
            >
              {isActivity && !rewardInfo?.alreadyPlay ? (
                t('cashReward.label.startNow')
              ) : (
                <div className="flex flex-col">
                  <span className="text-10">{t('cashReward.label.nextRoundTime')}</span>
                  <span className="text-base">
                    {(rewardInfo?.alreadyPlay ? rewardInfo?.nextRoundDate : rewardInfo?.roundDate) || '**:** ** - **:** **'}
                  </span>
                </div>
              )}
            </Button>
          </div>

          <RecordsPanel className="-mt-6 mx-3 mb-3 relative z-20" rewardInfo={rewardInfo} />
        </ScrollShadow>

        <NavBarSpacer />
      </div>

      {getRewardRender}
    </>
  )
}

export default CashRainPage
