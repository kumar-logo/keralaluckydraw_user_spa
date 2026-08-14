import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { Button, ScrollShadow } from '@nextui-org/react'
import { motion, useMotionValue, useTransform, animate as fmAnimate } from 'framer-motion'
import clsx from 'clsx'
import { getLuckySpinInfo, drawLuckySpin, getLuckySpinDrawHistory, getLuckySpinFreeHistory, getLuckySpinBarrage, type LuckySpinInfoDto, type LuckySpinDrawDto, type LuckySpinDrawHistoryItemDto, type LuckySpinFreeHistoryItemDto, type LuckySpinBarrageItemDto } from '../services/luckySpinApi'
import { getShareInfo, type ShareInfoDto } from '../services/userApi'
import { formatCurrency } from '../utils/format'
import { checkAuth, resolveAvatarUrl } from '../utils/helpers'
import { toast } from '../utils/toast'
import { fetchAndSyncBalance } from '../utils/fetchBalance'
import { useAuthStore } from '../stores/authStore'
import { useGameRulesModal } from '../components/shared/GameRules'
import { NoData } from '../components/shared/NoData'
import { copyToClipboard as copyWithFallback } from '../utils/clipboard'
import { ShareModal } from '../components/shared/ShareModal'

const SPRITE_BASE: React.CSSProperties = {
  backgroundImage: 'url(/images/lucky-spin/lucky-spin-sprite.webp)',
  backgroundSize: '47.25rem 28.875rem',
}

const SPRITE_POSITIONS = {
  tiger: 'left 0 top 0',
  spinBox: 'left -10.5rem top 0',
  spinPlate: 'right 0 top -8.375rem',
  shark: 'right -9.375rem top 0',
  btn: 'right 0 top 0',
  coin: 'right 0 top -6.875rem',
  star: 'top -21.625rem left 0',
  luckyspinText: 'right -1.25rem top -6.875rem',
  ledLight: 'left 0 top -23.375rem',
  ledDark: 'left -1.75rem top -23.375rem',
  balanceBox: 'left 0 top -25.625rem',
  wallet: 'left -12.5rem top -25.625rem',
  resultTarget: 'left -16.375rem top -20.25rem',
}

const LED_POSITIONS = [
  'top-9.5 left-9.5',
  '-left-1 top-35',
  'bottom-10 left-9.5',
  '-bottom-0.5 left-35',
  'right-10 bottom-10',
  '-right-0.5 top-35',
  'right-9.5 top-9.5',
]

const SpriteDiv = ({ className, pos, style, ...rest }: React.HTMLAttributes<HTMLDivElement> & {
  pos?: string
}) => (
  <div
    className={className}
    style={{ ...SPRITE_BASE, backgroundPosition: pos, ...style }}
    {...rest}
  />
)

const BarrageCard = ({ item }: { item: LuckySpinBarrageItemDto | null }) => {
  if (!item) return null
  return (
    <div className="flex items-center h-8 rounded-l-full bg-linear-to-r from-[#ffd84e99] from-60% to-[#ffd84e00] p-1 pr-6 border-l-2 border-[#ffd84e]">
      <div
        className="size-6 bg-no-repeat bg-contain border border-white rounded-full"
        style={{
          backgroundImage: `url(${resolveAvatarUrl(item.avatar)})`,
          boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.40)',
        }}
      />
      <span className="text-xs text-main font-bold ml-2 mr-1">{item.userPhone}</span>
      <span className="text-sm font-black din text-[#FF4747]">{formatCurrency(item.prizeAmount, 0)}</span>
      <div className="size-6 ml-6" style={{ ...SPRITE_BASE, backgroundPosition: SPRITE_POSITIONS.star }} />
    </div>
  )
}

const BarrageItem = ({ item, top, onFinish }: { item: LuckySpinBarrageItemDto; top: number; onFinish: () => void }) => {
  const ref = useRef<HTMLDivElement>(null)
  const controls = useRef<ReturnType<typeof fmAnimate> | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const container = el.parentElement
    if (!container) return
    const cw = container.clientWidth
    const iw = el.clientWidth
    const totalDist = cw + iw
    const duration = totalDist / 50
    controls.current = fmAnimate(el, { x: -totalDist }, {
      duration,
      ease: 'linear',
      onComplete: onFinish,
    })
    return () => controls.current?.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={ref}
      className="absolute whitespace-nowrap"
      style={{ top, left: '100%' }}
    >
      <BarrageCard item={item} />
    </div>
  )
}

let barrageKey = 0
const BarrageFeed = () => {
  const [entries, setEntries] = useState<{ id: number; item: LuckySpinBarrageItemDto; top: number }[]>([])
  const poolRef = useRef<LuckySpinBarrageItemDto[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const fetchMore = useCallback(() => {
    getLuckySpinBarrage(10).then((data) => {
      if (Array.isArray(data)) {
        poolRef.current.push(...data.filter((d) => Number(d.prizeAmount) > 0))
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    fetchMore()
    timerRef.current = setInterval(() => {
      if (poolRef.current.length === 0) {
        fetchMore()
        return
      }
      const next = poolRef.current.pop()
      if (next) {
        const id = ++barrageKey
        const top = (id % 3) * 46
        setEntries(prev => [...prev.slice(-5), { id, item: next, top }])
      }
    }, 5000)
    return () => clearInterval(timerRef.current)
  }, [fetchMore])

  const removeEntry = useCallback((id: number) => {
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [])

  return (
    <div className="absolute! z-30 left-0 top-25 pointer-events-none h-40 w-full flex">
      {entries.map(({ id, item, top }) => (
        <BarrageItem key={id} item={item} top={top} onFinish={() => removeEntry(id)} />
      ))}
    </div>
  )
}

const InfoCircleIcon = ({ className, ...rest }: React.SVGProps<SVGSVGElement>) => (
  <svg className={clsx('size-5', className)} viewBox="0 0 24 24" fill="none" {...rest}>
    <g clipPath="url(#clip0_20110_26478)">
      <path d="M11.998 22C14.7594 22 17.2594 20.8807 19.0691 19.0711C20.8787 17.2614 21.998 14.7614 21.998 12C21.998 9.2386 20.8787 6.7386 19.0691 4.92893C17.2594 3.11929 14.7594 2 11.998 2C9.23665 2 6.73665 3.11929 4.92698 4.92893C3.11734 6.7386 1.99805 9.2386 1.99805 12C1.99805 14.7614 3.11734 17.2614 4.92698 19.0711C6.73665 20.8807 9.23665 22 11.998 22Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M12 14.3125V12.3125C13.6568 12.3125 15 10.9693 15 9.3125C15 7.65565 13.6568 6.3125 12 6.3125C10.3432 6.3125 9 7.65565 9 9.3125" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path fillRule="evenodd" clipRule="evenodd" d="M12 18.8125C12.6904 18.8125 13.25 18.2529 13.25 17.5625C13.25 16.8722 12.6904 16.3125 12 16.3125C11.3097 16.3125 10.75 16.8722 10.75 17.5625C10.75 18.2529 11.3097 18.8125 12 18.8125Z" fill="currentColor" />
    </g>
    <defs><clipPath id="clip0_20110_26478"><rect width="24" height="24" fill="white" /></clipPath></defs>
  </svg>
)

const CopyIcon = ({ className, ...rest }: React.SVGProps<SVGSVGElement>) => (
  <svg className={clsx('size-3.5 text-acc', className)} viewBox="0 0 14 14" fill="none" {...rest}>
    <path d="M9.33333 3.16667C9.59855 3.16667 9.85291 3.27202 10.0404 3.45956C10.228 3.6471 10.3333 3.90145 10.3333 4.16667V13.5C10.3333 13.7652 10.228 14.0196 10.0404 14.2071C9.85291 14.3946 9.59855 14.5 9.33333 14.5H2C1.86868 14.5 1.73864 14.4741 1.61732 14.4239C1.49599 14.3736 1.38575 14.3 1.29289 14.2071C1.20003 14.1142 1.12638 14.004 1.07612 13.8827C1.02587 13.7614 1 13.6313 1 13.5V4.16667C1 3.90145 1.10536 3.6471 1.29289 3.45956C1.48043 3.27202 1.73478 3.16667 2 3.16667H9.33333ZM11.9973 0.5C12.246 0.499846 12.4859 0.592373 12.67 0.759522C12.8542 0.926671 12.9695 1.15645 12.9933 1.404L12.9973 1.5V10.4953C12.9971 10.6653 12.9321 10.8287 12.8154 10.9522C12.6988 11.0758 12.5394 11.1502 12.3697 11.1601C12.2001 11.1701 12.0331 11.1149 11.9028 11.0058C11.7725 10.8968 11.6887 10.7421 11.6687 10.5733L11.664 10.4953V1.83333H5C4.83671 1.83331 4.67911 1.77336 4.55709 1.66486C4.43506 1.55635 4.35711 1.40683 4.338 1.24467L4.33333 1.16667C4.33336 1.00338 4.3933 0.845776 4.50181 0.723752C4.61032 0.601729 4.75983 0.523772 4.922 0.504667L5 0.5H11.9973Z" fill="currentColor" />
  </svg>
)

const SpinHistory = ({ gameID, updateCode }: { gameID: number; updateCode: number }) => {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)
  const [drawList, setDrawList] = useState<LuckySpinDrawHistoryItemDto[]>([])
  const [freeList, setFreeList] = useState<LuckySpinFreeHistoryItemDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!gameID || !checkAuth(false, false)) { setLoading(false); return }
    setLoading(true)
    const isFirstTab = tab === 0
      ? getLuckySpinDrawHistory({ gameID, pageNo: 1, pageSize: 1e3 }).then((d) => setDrawList(Array.isArray(d) ? d : d.list ?? []))
      : getLuckySpinFreeHistory({ gameID, pageNo: 1, pageSize: 1e3 }).then((d) => setFreeList(Array.isArray(d) ? d : d.list ?? []))
    isFirstTab.catch(() => {}).finally(() => setLoading(false))
  }, [gameID, updateCode, tab])

  return (
    <div className="px-3 h-87.5">
      <div className="size-full flex flex-col py-4 px-3 border-2 border-[#ffefa5] rounded-2xl">

        <div className="flex mb-2">
          <Button
            className={clsx('flex-1 mr-2 border-2 border-[#ff6450] rounded-lg', tab === 0 ? 'bg-[#ff6450] text-white' : 'bg-[#0000] text-[#ff6450]')}
            onPress={() => tab !== 0 && setTab(0)}
          >
            {t('luckyspin.label.mySpin')}
          </Button>
          <Button
            className={clsx('flex-1 border-2 border-[#ff6450] rounded-lg', tab === 1 ? 'bg-[#ff6450] text-white' : 'bg-[#0000] text-[#ff6450]')}
            onPress={() => tab !== 1 && setTab(1)}
          >
            {t('luckyspin.label.freeSpinRec')}
          </Button>
        </div>

        <ScrollShadow className="flex-1 *:not-last:mb-5 *:flex *:justify-between *:items-center">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="size-6 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tab === 0 ? (
            <>
              {drawList.length === 0 && (
                <div className="h-40"><NoData /></div>
              )}
              {drawList.map((item, i) => (
                <div key={i}>
                  <div className="flex items-center text-sm">
                    {t('common.label.bet')}
                    <span className="font-bold ml-1">{formatCurrency(item.betAmount, 0)}</span>
                    {item.count > 1 && (
                      <span className="ml-1 text-white/60 text-10">× {item.count}</span>
                    )}
                    {item.betAmount === 0 && (
                      <div className="ml-2 text-primary text-10 font-bold px-2 py-0.5 rounded-full bg-main/20">
                        {t('luckyspin.label.freeSpin')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center text-xs">
                    {item.prizeSpin > 0 || item.prizeAmount > 0 ? (
                      <>
                        {t('common.label.won')}
                        {item.prizeAmount > 0 && <span className="font-black ml-1 text-[#fff309]">{formatCurrency(item.prizeAmount, 0)}</span>}
                        {item.prizeSpin > 0 && (
                          <span className="ml-1">
                            {item.prizeAmount > 0 && '&'} spin <span className="font-black text-[#fff309]">× {item.prizeSpin}</span>
                          </span>
                        )}
                      </>
                    ) : (
                      t('common.label.nowin')
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {freeList.length === 0 && (
                <div className="h-40"><NoData /></div>
              )}
              {freeList.map((item, i) => (
                <div key={i}>
                  <div className="flex items-center">
                    <div
                      className="size-7 rounded-full bg-no-repeat bg-cover border border-white shrink-0"
                      style={{ backgroundImage: `url(${resolveAvatarUrl(item.avatar)})` }}
                    />
                    <div className="ml-2">
                      <p className="font-xs text-white">{item.nickName}</p>
                      <p className="text-[#d34c4d] text-10">VIP Gift</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">Spin * {item.count}</p>
                    <p className="text-sec-acc text-10">{item.time}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </ScrollShadow>
      </div>
    </div>
  )
}

const checkInsufficientBalance = (amount: number, gameName: string, isBonus?: boolean): boolean => {
  if (amount !== amount) return false
  const state = useAuthStore.getState()
  if (isBonus) {
    if (!state.bonusBalance || state.bonusBalance < amount) {
      toast.warning(i18n.t('common.tip.info.bonusNotEnought'))
      return true
    }
    return false
  }
  if (state.balance < amount) {
    window.dispatchEvent(new CustomEvent('openRechargeDraw', {
      detail: { origin: `bet_${gameName}_insufficient_balance` },
    }))
    return true
  }
  return false
}

interface BounsPrize {
  amount?: number
  spin?: number
  tickets?: number
  jackpotCutoff?: number
  autoClose?: boolean
}

const showBounsPopup = (prize: number | BounsPrize, isCash = true) => {
  const detail = typeof prize === 'number'
    ? { amount: prize, spin: 0, tickets: 0, jackpotCutoff: 100, isCash }
    : { ...prize, isCash }
  if (detail.amount || detail.spin || detail.tickets) {
    window.dispatchEvent(new CustomEvent('showBouns', { detail }))
  }
}

const copyToClipboard = (text: string) => {
  const nx = (window as Window & { nexuses?: { copyText?: (text: string) => void } }).nexuses
  if (nx?.copyText) {
    nx.copyText(text)
    toast.success('Copied!')
    return
  }
  copyWithFallback(text, 'Copied!')
}

export const LuckySpinPage = () => {
  const { t } = useTranslation()

  const [info, setInfo] = useState<LuckySpinInfoDto | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [updateCode, setUpdateCode] = useState(0)
  const [shareInfo, setShareInfo] = useState<ShareInfoDto | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const spinCtrlRef = useRef<ReturnType<typeof fmAnimate> | null>(null)
  const resultRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const spinGuardRef = useRef(false)
  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false; clearTimeout(resultRef.current) }, [])

  const rotateAudio = useRef<HTMLAudioElement | null>(null)
  const loseAudio = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    rotateAudio.current = new Audio('/audio/rotate.mp3')
    loseAudio.current = new Audio('/audio/lose.mp3')
  }, [])

  const plateRotation = useMotionValue(0)
  const ledDriver = useMotionValue(0)

  const ledA = useTransform(ledDriver, (v: number) => Math.floor(v / 60) % 2 === 0 ? SPRITE_POSITIONS.ledLight : SPRITE_POSITIONS.ledDark)
  const ledB = useTransform(ledDriver, (v: number) => Math.floor(v / 60) % 2 === 0 ? SPRITE_POSITIONS.ledDark : SPRITE_POSITIONS.ledLight)
  const [ledPosA, setLedPosA] = useState(SPRITE_POSITIONS.ledLight)
  const [ledPosB, setLedPosB] = useState(SPRITE_POSITIONS.ledDark)

  useEffect(() => {
    const unsubA = ledA.on('change', (v) => setLedPosA(v))
    const unsubB = ledB.on('change', (v) => setLedPosB(v))
    return () => { unsubA(); unsubB() }
  }, [ledA, ledB])

  useEffect(() => {
    const ctrl = fmAnimate(ledDriver, [0, 360], {
      duration: 2,
      ease: 'linear',
      repeat: Infinity,
    })
    return () => ctrl.stop()
  }, [ledDriver])

  const price = info?.price ?? 10
  const freeCount = info?.freeCount ?? 0
  const gameID = info?.gameID ?? 0

  const price1 = useMemo(() => formatCurrency(price, 0), [price])
  const price30 = useMemo(() => formatCurrency(price * 30, 0), [price])
  const discountPrice1 = useMemo(() => formatCurrency(0, 0), [])
  const discountPrice30 = useMemo(() => {

    return formatCurrency(freeCount ? price * (freeCount >= 30 ? 0 : 30 - freeCount) : 0, 0)
  }, [price, freeCount])

  const fetchSpinInfo = useCallback(() => { getLuckySpinInfo().then((d) => setInfo(d)).catch(() => {}) }, [])
  const initPage = useCallback(() => {
    fetchSpinInfo()
    fetchAndSyncBalance()
    if (checkAuth(false, false)) getShareInfo().then((d) => setShareInfo(d)).catch(() => {})
  }, [fetchSpinInfo])

  useEffect(() => {
    initPage()

    if (localStorage.getItem('shortcuts_get_100rs')) {
      localStorage.removeItem('shortcuts_get_100rs')
      document.getElementById('LuckySpinInviteFriendTriggerBtn')?.click()
    }
  }, [initPage])

  const startFastSpin = useCallback(() => {

    spinCtrlRef.current = fmAnimate(plateRotation, plateRotation.get() + 360, {
      duration: 1,
      ease: 'easeIn',
      onComplete: () => {

        spinCtrlRef.current = fmAnimate(plateRotation, plateRotation.get() + 360, {
          duration: 0.5,
          ease: 'linear',
          repeat: Infinity,
        })
      },
    })
  }, [plateRotation])

  const stopAtPrize = useCallback((prizeIndex: number) => {
    if (prizeIndex < 0 || prizeIndex > 11) prizeIndex = 0
    if (spinCtrlRef.current) spinCtrlRef.current.stop()
    const current = plateRotation.get()
    const base = current - (current % 360)
    const within = (360 - prizeIndex * 30) % 360
    let target = base + within + 360 * 4
    while (target <= current + 360) target += 360
    spinCtrlRef.current = fmAnimate(plateRotation, target, {
      duration: 3,
      ease: 'easeOut',
    })
    return spinCtrlRef.current
  }, [plateRotation])

  const handleResult = useCallback((data: LuckySpinDrawDto, count: number) => {
    const { prizeAmount = 0, prizeSpin = 0 } = data

    if (prizeAmount || prizeSpin) {
      if (prizeAmount >= 500) {
        showBounsPopup({ amount: prizeAmount, autoClose: true })
      } else {
        showBounsPopup({
          amount: prizeAmount,
          spin: prizeSpin,
          autoClose: true,
          jackpotCutoff: count === 1 ? 50 : 500,
        })
      }
    } else {

      loseAudio.current?.play()
    }
  }, [])

  const landWheel = useCallback((data: LuckySpinDrawDto, count: number) => {
    stopAtPrize(data.prizeIndex ?? 0).then(() => {
      if (!mountedRef.current) return
      if (count) {
        spinGuardRef.current = false
        setBatchLoading(false)
        rotateAudio.current?.pause()
        handleResult(data, count)
        getLuckySpinInfo().then((d) => setInfo(d)).catch(() => {})
        fetchAndSyncBalance()
        setUpdateCode(c => c + 1)
        setShowResult(true)
        clearTimeout(resultRef.current)
        resultRef.current = setTimeout(() => { if (!mountedRef.current) return; setShowResult(false) }, 3000)
      }
    })
  }, [stopAtPrize, handleResult])

  const handleSpin = useCallback((count: number) => {
    if (!info || spinGuardRef.current) return
    if (!checkAuth()) return

    const fc = freeCount
    const cost = fc ? (fc >= count ? 0 : price * (count - fc)) : price * count
    if (checkInsufficientBalance(cost, 'lucky-spin')) return

    spinGuardRef.current = true
    setBatchLoading(true)

    useAuthStore.getState().decrementBalance?.(cost)

    startFastSpin()
    if (rotateAudio.current) {
      rotateAudio.current.currentTime = 0
      rotateAudio.current.play()
    }

    const spinStart = Date.now()
    clearTimeout(resultRef.current)
    setShowResult(false)

    drawLuckySpin(count, gameID).then((data) => {
      const elapsed = Date.now() - spinStart
      if (elapsed < 3000) {
        setTimeout(() => landWheel(data, count), 3000 - elapsed)
      } else {
        landWheel(data, count)
      }
    }).catch(() => {
      landWheel({ prizeIndex: 0, prizeAmount: 0, prizeSpin: 0 }, 0)
      rotateAudio.current?.pause()
      plateRotation.set(0)
      setBatchLoading(false)
      useAuthStore.getState().decrementBalance?.(-cost)
      fetchAndSyncBalance()
      spinGuardRef.current = false
    })
  }, [info, price, freeCount, gameID, startFastSpin, landWheel, plateRotation])

  const rulesModal = useGameRulesModal(info?.gameID)

  const balance = useAuthStore((s) => s.balance)

  return (
    <div className="bg-[#740b0e] flex flex-col text-white overflow-y-auto overflow-x-hidden size-full">
      <div
        className="bg-no-repeat bg-cover relative pb-20"
        style={{ backgroundImage: 'url(/images/lucky-spin/lucky-spin-bg.webp)', minHeight: '100%' }}
      >

        <div
          className="flex flex-col p-3 sticky top-0 left-0 z-40"
          style={{ background: 'linear-gradient(180deg, #871C17 0%, rgba(135, 28, 23, 0.00) 100%)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div
                className="cursor-pointer p-1"
                onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = '/index/home'))}
              >
                <svg viewBox="0 0 24 24" className="size-6" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-black">Lucky Spin</p>
            </div>
            <div className="flex items-center text-sm bg-black/20 py-1.5 px-2.5 rounded-lg z-10" onClick={rulesModal.open}>
              <InfoCircleIcon className="mr-1" />
              {t('common.label.games.rules')}
            </div>
            {rulesModal.render}
          </div>
        </div>

        <BarrageFeed />

        <div className="flex flex-col items-center -mb-4 relative z-20">
          <SpriteDiv className="w-49 h-13 flex items-center justify-center" pos={SPRITE_POSITIONS.balanceBox}>
            <SpriteDiv className="size-8 mr-2" pos={SPRITE_POSITIONS.wallet} />
            <div className="flex flex-col items-start justify-center">
              <p className="text-sm text-white leading-4">{t('common.label.balance')}</p>
              <p className="din text-lg leading-5.5 font-black">{formatCurrency(balance)}</p>
            </div>
          </SpriteDiv>
        </div>

        <div className="h-86 w-full relative shrink-0">

          <SpriteDiv className="h-86 w-41 absolute left-0 top-0" pos={SPRITE_POSITIONS.tiger} />

          <motion.div
            className="size-68 absolute left-1/2 bottom-4 -ml-34 bg-no-repeat"
            style={{ ...SPRITE_BASE, backgroundPosition: SPRITE_POSITIONS.spinPlate, rotate: plateRotation }}
          />

          <SpriteDiv
            className={clsx(
              'h-17.5 w-34 absolute left-1/2 top-21 -ml-17 rotate-90',
              showResult ? 'animate-flash animate-duration-300' : 'opacity-0'
            )}
            pos={SPRITE_POSITIONS.resultTarget}
          />

          <SpriteDiv className="h-80 w-76 absolute left-1/2 bottom-0" pos={SPRITE_POSITIONS.spinBox} style={{ marginLeft: '-9.5rem' }}>

            <div className="flex items-center justify-center flex-col text-black absolute left-1/2 top-1/2 size-10 -ml-5 -mt-3">
              <span className="text-xs uppercase font-bold">{t('common.label.free')}</span>
              <p className="text-2xl font-black din flex h-4 items-center text-nowrap">×{freeCount}</p>
            </div>

            <motion.div className="size-76 absolute left-0 bottom-0">
              {LED_POSITIONS.map((pos, i) => (
                <motion.div
                  key={pos}
                  className={clsx('size-6 absolute', pos)}
                  style={{
                    ...SPRITE_BASE,
                    backgroundPosition: i % 2 === 0 ? ledPosB : ledPosA,
                  }}
                />
              ))}
            </motion.div>
          </SpriteDiv>

          <SpriteDiv className="size-32.5 absolute right-2 -bottom-5 -mr-10" pos={SPRITE_POSITIONS.shark} />
        </div>

        <div className="mt-8 mb-4 px-5 flex items-end justify-around din font-black">

          <SpriteDiv
            onClick={() => handleSpin(1)}
            style={{ opacity: batchLoading ? 0.5 : 1, pointerEvents: batchLoading ? 'none' : 'auto' }}
            className="w-36.5 h-13.5 origin-bottom duration-200 active:h-12 rounded-b-xl border-b-2 border-b-red-900 flex flex-col"
            pos={SPRITE_POSITIONS.btn}
          >
            <div className="h-5 flex justify-center items-center mt-1">
              <SpriteDiv className="size-4 mr-1" pos={SPRITE_POSITIONS.coin} />
              {freeCount > 0 ? (
                <>
                  <span>{discountPrice1}</span>
                  <span className="font-medium text-white text-10 line-through ml-1">{price1}</span>
                </>
              ) : (
                <span>{price1}</span>
              )}
            </div>
            <div className="inter text-10 font-bold text-white/80 text-center">
              {t('common.label.spin')} × 1
            </div>
          </SpriteDiv>

          <SpriteDiv
            onClick={() => handleSpin(30)}
            style={{ opacity: batchLoading ? 0.5 : 1, pointerEvents: batchLoading ? 'none' : 'auto' }}
            className="w-36.5 h-13.5 origin-bottom duration-200 active:h-12 rounded-b-xl border-b-2 border-b-red-900 flex flex-col"
            pos={SPRITE_POSITIONS.btn}
          >
            <div className="h-5 flex justify-center items-center mt-1">
              <SpriteDiv className="size-4 mr-1" pos={SPRITE_POSITIONS.coin} />
              {freeCount > 0 ? (
                <>
                  <span>{discountPrice30}</span>
                  <span className="font-medium text-white text-10 line-through ml-1">{price30}</span>
                </>
              ) : (
                <span>{price30}</span>
              )}
            </div>
            <div className="inter text-10 font-bold text-white/80 text-center">
              {t('common.label.spin')} × 30
            </div>
          </SpriteDiv>
        </div>

        <div className="flex justify-center items-center text-sm">
          {t('luckyspin.label.myInviteCode')}: {shareInfo?.inviteCode ?? '------'}
          <CopyIcon
            className="text-white/70 size-4! ml-1 cursor-pointer"
            onClick={() => shareInfo?.inviteCode && copyToClipboard(shareInfo.inviteCode)}
          />
        </div>

        <div className="flex justify-center items-center">
          <Button
            id="LuckySpinInviteFriendTriggerBtn"
            className="text-[#744b0b] font-bold text-shadow-[0_1px_0_#ffffce99] border-2 border-[#9E1203] h-13 rounded-full w-75 mt-1 mb-3 text-base uppercase animate-scale-light"
            style={{
              backgroundImage: 'linear-gradient(180deg, #FFFEE2 0%, #FFEB72 42.31%, #C58420 78.85%, #FFFA73 100%)',
              '--light-start': '-4rem',
              '--light-end': '22.75rem',
              '--light-height': '6rem',
            } as React.CSSProperties}
            onPress={() => {
              if (!checkAuth()) return
              setShareOpen(true)
            }}
          >
            {t('luckyspin.label.getFree')}
          </Button>
        </div>

        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          url={`${location.origin}/meta/invite-active?inviteCode=${shareInfo?.inviteCode ?? ''}&channel=${localStorage.getItem('channel') ?? 'keralaluckydraw'}_invite`}
          code={shareInfo?.inviteCode}
        />

        <SpinHistory gameID={gameID} updateCode={updateCode} />
      </div>
    </div>
  )
}

export default LuckySpinPage
